"use client";

import { useMemo, useState } from "react";
import { Section } from "@/components/ui/section";
import type { CheckinPageData } from "./checkin-service";

type ReadyCheckinData = Extract<CheckinPageData, { state: "ready" }>;

type LocationState =
  | { state: "idle"; message: string }
  | { state: "resolving"; message: string }
  | { state: "ready"; message: string; latitude: number; longitude: number; accuracy: number | null }
  | { state: "error"; message: string };

export function CheckinView({ data }: { data: ReadyCheckinData }) {
  const [today, setToday] = useState(data.today);
  const [locationState, setLocationState] = useState<LocationState>({
    state: "idle",
    message: "请先获取当前位置，再进行上下班打卡。",
  });
  const [submitState, setSubmitState] = useState<"idle" | "submitting">("idle");
  const [feedback, setFeedback] = useState("");

  const canPunchIn = !today.firstIn;
  const canPunchOut = Boolean(today.firstIn) && !today.lastOut;

  const progressText = useMemo(() => {
    if (today.lastOut) return "今日上下班打卡已完成";
    if (today.firstIn) return "今日已完成上班打卡，等待下班打卡";
    return "今日尚未打卡";
  }, [today.firstIn, today.lastOut]);

  async function resolveLocation() {
    if (!navigator.geolocation) {
      setLocationState({ state: "error", message: "当前浏览器不支持定位，请换用支持定位的设备或浏览器。" });
      return;
    }

    setLocationState({ state: "resolving", message: "正在获取当前位置..." });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationState({
          state: "ready",
          message: "定位成功，可以开始打卡。",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
        });
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "你拒绝了定位权限，请在浏览器里允许定位后重试。"
            : error.code === error.POSITION_UNAVAILABLE
              ? "当前无法获取定位，请检查设备定位服务。"
              : "获取定位超时，请稍后重试。";
        setLocationState({ state: "error", message });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }

  async function punch(punchType: "in" | "out") {
    if (locationState.state !== "ready") {
      setFeedback("请先成功获取当前位置，再进行打卡。");
      return;
    }

    setSubmitState("submitting");
    setFeedback("");

    const response = await fetch("/api/checkin/punch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        punchType,
        latitude: locationState.latitude,
        longitude: locationState.longitude,
        accuracy: locationState.accuracy,
        deviceInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
        },
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      today?: ReadyCheckinData["today"];
    };

    if (!response.ok || !payload.today) {
      setFeedback(payload.error ?? "打卡失败，请稍后重试。");
      setSubmitState("idle");
      return;
    }

    setToday(payload.today);
    setFeedback(punchType === "in" ? "上班打卡成功。" : "下班打卡成功。");
    setSubmitState("idle");
  }

  return (
    <>
      <section className="rounded-3xl bg-[linear-gradient(135deg,#8a5a2f_0%,#b87b45_100%)] p-5 text-white shadow-sm">
        <p className="text-sm text-white/75">KOMO 打卡中心</p>
        <h2 className="mt-1 text-lg font-semibold">{data.viewer.fullName}</h2>
        <p className="mt-2 text-sm leading-6 text-white/85">
          {data.viewer.departmentName ?? "未分配部门"} · {data.viewer.employeeNo ?? "未设置工号"}
        </p>
        <div className="mt-4 rounded-2xl bg-white/12 p-3 text-sm">
          <p>{progressText}</p>
          <p className="mt-1 text-white/75">今天的打卡记录会直接写入正式考勤表。</p>
        </div>
      </section>

      <Section title="当前位置">
        <div className="space-y-3 text-sm">
          <div className="rounded-xl bg-[#f8f3ec] p-3 text-[#6b5845]">{locationState.message}</div>
          {locationState.state === "ready" ? (
            <div className="rounded-xl bg-[#fffaf4] p-3 text-[#6b5845]">
              <p>纬度：{locationState.latitude.toFixed(6)}</p>
              <p className="mt-1">经度：{locationState.longitude.toFixed(6)}</p>
              <p className="mt-1">精度：{locationState.accuracy ? `${Math.round(locationState.accuracy)} 米` : "未知"}</p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => void resolveLocation()}
            disabled={locationState.state === "resolving"}
            className="w-full rounded-2xl bg-[#f0e5d7] py-3 text-sm font-medium text-[#8a5a2f] disabled:bg-[#e5ddd2] disabled:text-[#9b948b]"
          >
            {locationState.state === "resolving" ? "定位中..." : "获取当前位置"}
          </button>
        </div>
      </Section>

      <Section title="上下班打卡">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={!canPunchIn || submitState === "submitting"}
            onClick={() => void punch("in")}
            className="rounded-2xl bg-[#8a5a2f] py-4 text-sm font-semibold text-white shadow-sm disabled:bg-[#cdb7a0]"
          >
            {today.firstIn ? "已上班打卡" : "上班打卡"}
          </button>
          <button
            type="button"
            disabled={!canPunchOut || submitState === "submitting"}
            onClick={() => void punch("out")}
            className="rounded-2xl bg-[#2d6a4f] py-4 text-sm font-semibold text-white shadow-sm disabled:bg-[#a7c5b6]"
          >
            {today.lastOut ? "已下班打卡" : "下班打卡"}
          </button>
        </div>
        {feedback ? <p className="mt-3 text-sm text-[#8a5a2f]">{feedback}</p> : null}
      </Section>

      <Section title="今日打卡记录">
        <div className="space-y-3">
          {today.records.length > 0 ? (
            today.records.map((record) => (
              <div key={record.id} className="rounded-xl bg-[#f8f3ec] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-[#17202f]">{record.punch_type === "in" ? "上班打卡" : "下班打卡"}</p>
                  <span className="text-sm text-[#6b5845]">{formatDateTime(record.punch_time)}</span>
                </div>
                <p className="mt-2 text-xs text-[#7b6c5c]">{formatLocation(record.location)}</p>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-[#e2d8ca] bg-[#fffdf9] p-4 text-sm text-[#607089]">今天还没有打卡记录。</div>
          )}
        </div>
      </Section>
    </>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatLocation(location: unknown) {
  if (!location || typeof location !== "object") {
    return "未记录定位信息";
  }

  const value = location as {
    latitude?: number;
    longitude?: number;
    accuracy?: number | null;
  };

  if (typeof value.latitude !== "number" || typeof value.longitude !== "number") {
    return "未记录定位信息";
  }

  return `定位：${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}${typeof value.accuracy === "number" ? ` · 精度 ${Math.round(value.accuracy)} 米` : ""}`;
}
