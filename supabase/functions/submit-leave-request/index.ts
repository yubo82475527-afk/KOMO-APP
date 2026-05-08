import { createClient } from "jsr:@supabase/supabase-js@2";

type TemplateStep = {
  id: string;
  step_order: number;
  name: string;
  approver_type: "direct_manager" | "department_head" | "role" | "user";
  role_code: string | null;
  approver_id: string | null;
};

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
  const payload = {
    leaveType: String(body.leaveType ?? ""),
    startDate: String(body.startDate ?? ""),
    endDate: String(body.endDate ?? ""),
    days: Number(body.days ?? 0),
    reason: String(body.reason ?? ""),
    attachments: Array.isArray(body.attachments) ? body.attachments : [],
  };

  if (!payload.leaveType || !payload.startDate || !payload.endDate || payload.days <= 0 || payload.reason.length < 4) {
    return json({ error: "Invalid leave request payload" }, 400);
  }

  const { data: requester, error: requesterError } = await adminClient
    .from("profiles")
    .select("id, full_name, department_id, manager_id, departments(head_id)")
    .eq("id", userData.user.id)
    .single();

  if (requesterError || !requester) return json({ error: "Requester profile not found" }, 422);

  const { data: template, error: templateError } = await adminClient
    .from("approval_templates")
    .select("id, approval_template_steps(id, step_order, name, approver_type, role_code, approver_id)")
    .eq("request_type", "leave")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (templateError || !template) return json({ error: "No active leave approval template" }, 422);

  const templateSteps = ((template.approval_template_steps ?? []) as TemplateStep[])
    .slice()
    .sort((a, b) => a.step_order - b.step_order);

  if (templateSteps.length === 0) return json({ error: "Approval template has no steps" }, 422);

  const resolvedSteps = [];
  for (const step of templateSteps) {
    const approverId = await resolveApprover(adminClient, requester, step);
    if (!approverId) {
      return json({ error: `Approver not found for step ${step.step_order}: ${step.name}` }, 422);
    }
    resolvedSteps.push({ ...step, approverId });
  }

  const { data: request, error: requestError } = await adminClient
    .from("approval_requests")
    .insert({
      requester_id: userData.user.id,
      type: "leave",
      title: `${payload.leaveType} ${payload.startDate} 至 ${payload.endDate}`,
      payload,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (requestError) return json({ error: requestError.message }, 500);

  const { error: stepsError } = await adminClient.from("approval_steps").insert(
    resolvedSteps.map((step, index) => ({
      request_id: request.id,
      template_step_id: step.id,
      approver_id: step.approverId,
      approver_type: step.approver_type,
      role_code: step.role_code,
      step_order: step.step_order,
      status: index === 0 ? "pending" : "waiting",
    })),
  );

  if (stepsError) return json({ error: stepsError.message }, 500);
  return json({ id: request.id });
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

async function resolveApprover(adminClient: ReturnType<typeof createClient>, requester: Record<string, unknown>, step: TemplateStep) {
  if (step.approver_type === "direct_manager") return requester.manager_id as string | null;
  if (step.approver_type === "department_head") {
    const department = requester.departments as { head_id?: string | null } | null;
    return department?.head_id ?? null;
  }
  if (step.approver_type === "user") return step.approver_id;
  if (step.approver_type === "role" && step.role_code) {
    const { data, error } = await adminClient
      .from("user_roles")
      .select("profile_id, roles!inner(code)")
      .eq("roles.code", step.role_code);

    if (error) throw error;
    if (!data || data.length !== 1) return null;
    return data[0].profile_id as string;
  }
  return null;
}
