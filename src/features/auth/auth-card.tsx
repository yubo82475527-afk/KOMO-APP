"use client";

import { useState } from "react";
import { getDictionary, type SupportedLocale } from "@/lib/i18n";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type AuthCardProps = {
  redirectTo?: string;
  locale?: SupportedLocale;
};

export function AuthCard({ redirectTo = "/schedule", locale = "zh-CN" }: AuthCardProps) {
  const dictionary = getDictionary(locale);
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState(dictionary.auth.loginHint);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setStatus("error");
      setMessage(dictionary.auth.missingCredentials);
      return;
    }

    setStatus("submitting");
    setMessage(dictionary.auth.checkingAccount);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      setStatus("success");
      setMessage(dictionary.auth.loginSuccess);
      window.location.assign(redirectTo);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : dictionary.auth.loginFailed);
    }
  }

  return (
    <section className="rounded-3xl border border-[#d9dee8] bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#607089]">{dictionary.auth.authProvider}</p>
        <h2 className="text-xl font-semibold text-[#17202f]">{dictionary.auth.emailPasswordLogin}</h2>
        <p className={`text-sm leading-6 ${status === "error" ? "text-[#c1121f]" : "text-[#607089]"}`}>{message}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <label className="block">
          <span className="text-sm text-[#607089]">{dictionary.auth.email}</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@company.com"
            className="mt-2 w-full rounded-2xl border border-[#d9dee8] px-4 py-3 text-sm outline-none transition focus:border-[#184e77]"
            autoComplete="email"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm text-[#607089]">{dictionary.auth.password}</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={dictionary.auth.passwordPlaceholder}
            className="mt-2 w-full rounded-2xl border border-[#d9dee8] px-4 py-3 text-sm outline-none transition focus:border-[#184e77]"
            autoComplete="current-password"
            minLength={8}
            required
          />
        </label>

        <div className="rounded-2xl bg-[#f4f7fb] px-4 py-3 text-sm leading-6 text-[#607089]">
          {dictionary.auth.internalOnly}
          <br />
          {dictionary.auth.initialPassword} <span className="font-semibold text-[#17202f]">Aa123456</span>。
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full rounded-2xl bg-[#184e77] py-3 text-sm font-medium text-white disabled:bg-[#8a97a8]"
        >
          {status === "submitting" ? dictionary.auth.loggingIn : dictionary.auth.login}
        </button>
      </form>
    </section>
  );
}
