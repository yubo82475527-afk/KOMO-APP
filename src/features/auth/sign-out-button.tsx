"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getDictionary, type SupportedLocale } from "@/lib/i18n";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function SignOutButton({ redirectTo = "/", locale = "zh-CN" }: { redirectTo?: string; locale?: SupportedLocale }) {
  const dictionary = getDictionary(locale);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSignOut() {
    setIsSubmitting(true);
    setError("");

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      setIsSubmitting(false);
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => void handleSignOut()}
        className="w-full rounded-2xl bg-white py-4 font-semibold text-[#c1121f] shadow-sm disabled:text-[#8a97a8]"
      >
        {isSubmitting ? dictionary.auth.signingOut : dictionary.auth.signOut}
      </button>
      {error ? <p className="mt-3 text-center text-sm text-[#c1121f]">{error}</p> : null}
    </>
  );
}
