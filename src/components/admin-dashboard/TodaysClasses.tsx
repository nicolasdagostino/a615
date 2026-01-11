"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type TodayClass = {
  id: string;
  name: string;
  coach: string;
  type: string; // crossfit | open-box | weightlifting | gymnastics
  day: string;  // mon..sun
  time: string; // HH:MM
  status: string;
  durationMin: number;
  capacity: number;
  notes: string | null;
  wod: null | {
    id: string;
    wodDate: string;
    track: string;
    title: string | null;
    coachNotes: string | null;
  };
};

type TodayResp = {
  ok: boolean;
  mode?: "today" | "next";
  offsetDays?: number;
  baseDate?: string;
  date: string;
  day: string;
  classes: TodayClass[];
  missingWodTypes: string[];
  error?: string;
};

function toUiType(type: string) {
  const s = (type || "").trim().toLowerCase();
  if (s === "crossfit") return "CrossFit";
  if (s === "open-box") return "Open Box";
  if (s === "weightlifting") return "Weightlifting";
  if (s === "gymnastics") return "Gymnastics";
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Class";
}

function monthYearFromISO(dateISO: string) {
  // YYYY-MM-DD
  const y = Number(dateISO.slice(0, 4)) || new Date().getFullYear();
  const m = Number(dateISO.slice(5, 7)) || new Date().getMonth() + 1;
  return { y, m };
}

export default function TodaysClasses() {
  const [data, setData] = useState<TodayResp | null>(null);
  const [loading, setLoading] = useState(true);

  const items = useMemo(() => data?.classes || [], [data]);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        const res = await fetch("/api/athlete/today", { cache: "no-store" });
        const json = (await res.json().catch(() => ({}))) as TodayResp;

        if (!alive) return;
        if (!res.ok) {
          setData({
            ok: false,
            date: "",
            day: "",
            classes: [],
            missingWodTypes: [],
            error: json?.error || "Failed",
          });
          return;
        }
        setData(json);
      } catch (e: any) {
        if (!alive) return;
        setData({
          ok: false,
          date: "",
          day: "",
          classes: [],
          missingWodTypes: [],
          error: e?.message || "Failed",
        });
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, []);

  const subtitle = useMemo(() => {
    if (!data?.ok) return "";
    const mode = data.mode || "today";
    if (mode === "today") return `${data.date} (${data.day})`;
    const off = typeof data.offsetDays === "number" ? data.offsetDays : null;
    const offText = off !== null ? `in ${off} day${off === 1 ? "" : "s"}` : "next";
    return `Next classes ${offText}: ${data.date} (${data.day})`;
  }, [data]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">Classes</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>

          {loading ? (
            <span className="text-sm text-gray-500 dark:text-gray-400">Loading…</span>
          ) : null}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {!loading && data?.error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
            {data.error}
          </div>
        ) : null}

        {!loading && data?.ok && items.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No classes found (next 7 days).
          </div>
        ) : null}

        <div className="space-y-3">
          {items.map((c) => {
            const dateISO = (c.wod?.wodDate || data?.date || "").trim();
            const href = `/admin/wod-feed?track=${encodeURIComponent(c.type)}${
              dateISO ? `&date=${encodeURIComponent(dateISO)}` : ""
            }`;
            

            return (
              <div
                key={c.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-base font-semibold text-gray-800 dark:text-white">
                      {c.time}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      — {toUiType(c.type)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      · Coach: {c.coach}
                    </span>
                  </div>

                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {c.wod ? (
                      <>
                        <span className="font-medium">WOD:</span>{" "}
                        {c.wod.title ? c.wod.title : "WOD del día"}{" "}
                        <span className="text-gray-500 dark:text-gray-400">
                          ({c.wod.track})
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">WOD pendiente</span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={href}
                    className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
                  >
                    Ver WOD Feed
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && data?.ok && data.missingWodTypes?.length ? (
          <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900/40 dark:bg-yellow-950/30 dark:text-yellow-200">
            Falta publicar WOD para: <span className="font-medium">{data.missingWodTypes.join(", ")}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
