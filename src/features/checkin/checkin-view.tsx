"use client";

import { useMemo, useState } from "react";
import { formatDateTime } from "@/lib/date-time";
import { getDictionary } from "@/lib/i18n";
import { Section } from "@/components/ui/section";
import type { CheckinPageData } from "./checkin-service";

type ReadyCheckinData = Extract<CheckinPageData, { state: "ready" }>;

type LocationState =
  | { state: "idle"; message: string }
  | { state: "resolving"; message: string }
  | { state: "ready"; message: string; latitude: number; longitude: number; accuracy: number | null }
  | { state: "error"; message: string };

export function CheckinView({ data }: { data: ReadyCheckinData }) {
  const dictionary = getDictionary(data.locale);
  const [today, setToday] = useState(data.today);
  const [locationState, setLocationState] = useState<LocationState>({
    state: "idle",
    message: dictionary.checkin.getLocationFirst,
  });
  const [submitState, setSubmitState] = useState<"idle" | "submitting">("idle");
  const [feedback, setFeedback] = useState("");

  const canPunchIn = !today.firstIn;
  const canPunchOut = Boolean(today.firstIn) && !today.lastOut;

  const progressText = useMemo(() => {
    if (today.lastOut) return dictionary.checkin.progressDone;
    if (today.firstIn) return dictionary.checkin.progressIn;
    return dictionary.checkin.progressIdle;
  }, [dictionary.checkin.progressDone, dictionary.checkin.progressIdle, dictionary.checkin.progressIn, today.firstIn, today.lastOut]);

  async function resolveLocation() {
    if (!navigator.geolocation) {
      setLocationState({ state: "error", message: dictionary.checkin.locationUnsupported });
      return;
    }

    setLocationState({ state: "resolving", message: dictionary.checkin.locating });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationState({
          state: "ready",
          message: dictionary.checkin.locationReady,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
        });
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? dictionary.checkin.locationDenied
            : error.code === error.POSITION_UNAVAILABLE
              ? dictionary.checkin.locationUnavailable
              : dictionary.checkin.locationTimeout;
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
      setFeedback(dictionary.checkin.needLocation);
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
      setFeedback(payload.error ?? dictionary.checkin.punchFailed);
      setSubmitState("idle");
      return;
    }

    setToday(payload.today);
    setFeedback(punchType === "in" ? dictionary.checkin.punchInSuccess : dictionary.checkin.punchOutSuccess);
    setSubmitState("idle");
  }

  return (
    <>
      <section className="rounded-3xl bg-[linear-gradient(135deg,#8a5a2f_0%,#b87b45_100%)] p-5 text-white shadow-sm">
        <p className="text-sm text-white/75">{dictionary.checkin.centerTitle}</p>
        <h2 className="mt-1 text-lg font-semibold">{data.viewer.fullName}</h2>
        <p className="mt-2 text-sm leading-6 text-white/85">
          {data.viewer.departmentName ?? dictionary.checkin.unassignedDepartment} · {data.viewer.employeeNo ?? dictionary.checkin.noEmployeeNo}
        </p>
        <div className="mt-4 rounded-2xl bg-white/12 p-3 text-sm">
          <p>{progressText}</p>
          <p className="mt-1 text-white/75">{dictionary.checkin.writeAttendance}</p>
        </div>
      </section>

      <Section title={dictionary.checkin.currentLocation}>
        <div className="space-y-3 text-sm">
          <div className="rounded-xl bg-[#f8f3ec] p-3 text-[#6b5845]">{locationState.message}</div>
          {locationState.state === "ready" ? (
            <div className="rounded-xl bg-[#fffaf4] p-3 text-[#6b5845]">
              <p>{dictionary.checkin.latitude}：{locationState.latitude.toFixed(6)}</p>
              <p className="mt-1">{dictionary.checkin.longitude}：{locationState.longitude.toFixed(6)}</p>
              <p className="mt-1">{dictionary.checkin.accuracy}：{locationState.accuracy ? `${Math.round(locationState.accuracy)} m` : dictionary.checkin.unknownAccuracy}</p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => void resolveLocation()}
            disabled={locationState.state === "resolving"}
            className="w-full rounded-2xl bg-[#f0e5d7] py-3 text-sm font-medium text-[#8a5a2f] disabled:bg-[#e5ddd2] disabled:text-[#9b948b]"
          >
            {locationState.state === "resolving" ? dictionary.checkin.locating : dictionary.checkin.getCurrentLocation}
          </button>
        </div>
      </Section>

      <Section title={dictionary.checkin.punchSection}>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={!canPunchIn || submitState === "submitting"}
            onClick={() => void punch("in")}
            className="rounded-2xl bg-[#8a5a2f] py-4 text-sm font-semibold text-white shadow-sm disabled:bg-[#cdb7a0]"
          >
            {today.firstIn ? dictionary.checkin.punchedIn : dictionary.checkin.punchIn}
          </button>
          <button
            type="button"
            disabled={!canPunchOut || submitState === "submitting"}
            onClick={() => void punch("out")}
            className="rounded-2xl bg-[#2d6a4f] py-4 text-sm font-semibold text-white shadow-sm disabled:bg-[#a7c5b6]"
          >
            {today.lastOut ? dictionary.checkin.punchedOut : dictionary.checkin.punchOut}
          </button>
        </div>
        {feedback ? <p className="mt-3 text-sm text-[#8a5a2f]">{feedback}</p> : null}
      </Section>

      <Section title={dictionary.checkin.todayRecords}>
        <div className="space-y-3">
          {today.records.length > 0 ? (
            today.records.map((record) => (
              <div key={record.id} className="rounded-xl bg-[#f8f3ec] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-[#17202f]">{record.punch_type === "in" ? dictionary.checkin.punchIn : dictionary.checkin.punchOut}</p>
                  <span className="text-sm text-[#6b5845]">{formatDateTime(record.punch_time, data.locale, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}</span>
                </div>
                <p className="mt-2 text-xs text-[#7b6c5c]">{formatLocation(record.location, dictionary)}</p>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-[#e2d8ca] bg-[#fffdf9] p-4 text-sm text-[#607089]">{dictionary.checkin.noRecords}</div>
          )}
        </div>
      </Section>
    </>
  );
}

function formatLocation(location: unknown, dictionary: ReturnType<typeof getDictionary>) {
  if (!location || typeof location !== "object") {
    return dictionary.checkin.noLocation;
  }

  const value = location as {
    latitude?: number;
    longitude?: number;
    accuracy?: number | null;
  };

  if (typeof value.latitude !== "number" || typeof value.longitude !== "number") {
    return dictionary.checkin.noLocation;
  }

  return `${dictionary.checkin.locationPrefix}：${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}${typeof value.accuracy === "number" ? ` · ${dictionary.checkin.accuracy} ${Math.round(value.accuracy)} m` : ""}`;
}
