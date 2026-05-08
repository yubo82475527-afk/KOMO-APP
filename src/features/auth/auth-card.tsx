"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type AuthCardProps = {
  redirectTo?: string;
};

export function AuthCard({ redirectTo = "/schedule" }: AuthCardProps) {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("请输入公司邮箱和密码登录。员工账号由管理员统一创建，初始密码为 Aa123456。");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setStatus("error");
      setMessage("请先输入邮箱和密码。");
      return;
    }

    setStatus("submitting");
    setMessage("正在校验账号...");

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
      setMessage("登录成功，正在进入系统...");
      window.location.assign(redirectTo);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "登录失败，请稍后重试。");
    }
  }

  return (
    <section className="rounded-3xl border border-[#d9dee8] bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#607089]">Supabase Auth</p>
        <h2 className="text-xl font-semibold text-[#17202f]">邮箱密码登录</h2>
        <p className={`text-sm leading-6 ${status === "error" ? "text-[#c1121f]" : "text-[#607089]"}`}>{message}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <label className="block">
          <span className="text-sm text-[#607089]">邮箱</span>
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
          <span className="text-sm text-[#607089]">密码</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="请输入密码"
            className="mt-2 w-full rounded-2xl border border-[#d9dee8] px-4 py-3 text-sm outline-none transition focus:border-[#184e77]"
            autoComplete="current-password"
            minLength={8}
            required
          />
        </label>

        <div className="rounded-2xl bg-[#f4f7fb] px-4 py-3 text-sm leading-6 text-[#607089]">
          内部员工账号暂不开放自助注册。
          <br />
          首次登录请使用管理员分配的邮箱和初始密码 <span className="font-semibold text-[#17202f]">Aa123456</span>。
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full rounded-2xl bg-[#184e77] py-3 text-sm font-medium text-white disabled:bg-[#8a97a8]"
        >
          {status === "submitting" ? "登录中..." : "登录"}
        </button>
      </form>
    </section>
  );
}
