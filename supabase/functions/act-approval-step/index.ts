import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing authorization header" }, 401);

  const supabaseUrl = getEnv("SUPABASE_URL");
  const userClient = createClient(supabaseUrl, getEnv("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(supabaseUrl, getEnv("SUPABASE_SERVICE_ROLE_KEY"));

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "Invalid session" }, 401);

  const body = await req.json();
  const requestId = String(body.requestId ?? "");
  const action = String(body.action ?? "");
  const comment = String(body.comment ?? "");

  if (!requestId || !["approved", "rejected"].includes(action)) {
    return json({ error: "Invalid approval action payload" }, 400);
  }

  const { data: request, error: requestError } = await adminClient
    .from("approval_requests")
    .select("id, status")
    .eq("id", requestId)
    .single();

  if (requestError || !request) return json({ error: "Approval request not found" }, 404);
  if (request.status !== "submitted") return json({ error: "Approval request is already finished" }, 409);

  const { data: currentStep, error: stepError } = await adminClient
    .from("approval_steps")
    .select("id, approver_id, step_order")
    .eq("request_id", requestId)
    .eq("status", "pending")
    .single();

  if (stepError || !currentStep) return json({ error: "No pending approval step" }, 409);
  if (currentStep.approver_id !== userData.user.id) return json({ error: "Only current approver can act on this step" }, 403);

  const { error: updateStepError } = await adminClient
    .from("approval_steps")
    .update({ status: action, comment, acted_at: new Date().toISOString() })
    .eq("id", currentStep.id);

  if (updateStepError) return json({ error: updateStepError.message }, 500);

  if (action === "rejected") {
    const { error } = await adminClient.from("approval_requests").update({ status: "rejected" }).eq("id", requestId);
    if (error) return json({ error: error.message }, 500);
    return json({ status: "rejected" });
  }

  const { data: nextStep, error: nextStepError } = await adminClient
    .from("approval_steps")
    .select("id")
    .eq("request_id", requestId)
    .eq("status", "waiting")
    .order("step_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (nextStepError) return json({ error: nextStepError.message }, 500);

  if (nextStep) {
    const { error } = await adminClient.from("approval_steps").update({ status: "pending" }).eq("id", nextStep.id);
    if (error) return json({ error: error.message }, 500);
    return json({ status: "submitted" });
  }

  const { error: finishError } = await adminClient.from("approval_requests").update({ status: "approved" }).eq("id", requestId);
  if (finishError) return json({ error: finishError.message }, 500);
  return json({ status: "approved" });
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}
