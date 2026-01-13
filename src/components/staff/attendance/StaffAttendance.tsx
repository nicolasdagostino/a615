"use client";

import React, { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import type { BadgeColor } from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";

type RosterRow = {
  userId: string;
  name: string;
  email: string | null;
  attendanceStatus: "present" | "absent" | null;
};

type StaffSession = {
  id: string;
  date: string;
  time: string;
  status: string;
  notes?: string | null;
  class: { id: string; name: string; coach: string; type: string };
  roster: RosterRow[];
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function fmtDateES(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${pad2(d)}/${pad2(m)}/${y}`;
}

/** YYYY-MM-DD en Europe/Madrid */
function isoTodayMadrid() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

function badgeForAttendance(st: "present" | "absent" | null): { label: string; color: BadgeColor } {
  if (st === "present") return { label: "Asistió", color: "success" };
  if (st === "absent") return { label: "Ausente", color: "error" };
  return { label: "Pendiente", color: "info" };
}

function badgeForType(type: string): { label: string; color: BadgeColor } {
  const t = (type || "").trim().toLowerCase();
  if (t === "open-box" || t === "open box") return { label: "Open Box", color: "warning" };
  if (t === "weightlifting") return { label: "Weightlifting", color: "success" };
  if (t === "gymnastics") return { label: "Gymnastics", color: "info" };
  if (t === "crossfit") return { label: "CrossFit", color: "success" };
  return { label: type || "Clase", color: "warning" };
}

export default function StaffAttendance() {
  const [dateISO, setDateISO] = useState<string>(() => isoTodayMadrid());
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<StaffSession[]>([]);
  const [err, setErr] = useState<string>("");

  const load = async (d: string) => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`/api/staff/attendance?date=${encodeURIComponent(d)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String((data as any)?.error || "Failed"));
      setSessions(Array.isArray((data as any)?.sessions) ? ((data as any).sessions as StaffSession[]) : []);
    } catch (e: any) {
      console.error(e);
      setSessions([]);
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(dateISO);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mark = async (sessionId: string, userId: string, status: "present" | "absent") => {
    setErr("");
    // optimistic update
    setSessions((prev) =>
      prev.map((s) =>
        s.id !== sessionId
          ? s
          : {
              ...s,
              roster: s.roster.map((r) => (r.userId === userId ? { ...r, attendanceStatus: status } : r)),
            }
      )
    );

    try {
      const res = await fetch("/api/staff/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ sessionId, userId, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String((data as any)?.error || "No se pudo guardar"));
    } catch (e: any) {
      setErr(e?.message || "No se pudo guardar");
      // rollback recargando
      await load(dateISO);
    }
  };

  const totals = useMemo(() => {
    const totalAthletes = sessions.reduce((acc, s) => acc + (s.roster?.length || 0), 0);
    const marked = sessions.reduce(
      (acc, s) => acc + (s.roster || []).filter((r) => r.attendanceStatus === "present" || r.attendanceStatus === "absent").length,
      0
    );
    return { totalAthletes, marked };
  }, [sessions]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Asistencia</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Marcá Asistió/Ausente. Esto aparece en el historial del atleta.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <input
                type="date"
                value={dateISO}
                onChange={(e) => setDateISO(e.target.value)}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>

            <Button variant="outline" onClick={() => load(dateISO)}>
              Ver día
            </Button>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              Marcados: <span className="font-medium text-gray-700 dark:text-gray-300">{totals.marked}/{totals.totalAthletes}</span>
            </div>
          </div>
        </div>

        <div className="p-5">
          {err ? (
            <div className="mb-4 rounded-2xl border border-error-200 bg-error-50 p-4 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-200">
              {err}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
              Cargando…
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
              No hay sesiones para {fmtDateES(dateISO)}.
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((s) => {
                const type = badgeForType(s.class?.type);
                const people = s.roster?.length || 0;

                return (
                  <div
                    key={s.id}
                    className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
                  >
                    <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{s.time}</p>
                          <Badge size="sm" color={type.color}>{type.label}</Badge>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white/90">
                            {s.class?.name || "Sesión"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Coach: <span className="font-medium text-gray-700 dark:text-gray-300">{s.class?.coach || "—"}</span>
                          {s.notes ? <span> · {s.notes}</span> : null}
                        </p>
                      </div>

                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Reservados: <span className="font-medium text-gray-700 dark:text-gray-300">{people}</span>
                      </div>
                    </div>

                    <div className="p-5">
                      {people === 0 ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400">No hay reservados.</div>
                      ) : (
                        <div className="space-y-3">
                          {s.roster.map((r) => {
                            const att = badgeForAttendance(r.attendanceStatus);
                            return (
                              <div
                                key={r.userId}
                                className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{r.name}</p>
                                    <Badge size="sm" color={att.color}>{att.label}</Badge>
                                  </div>
                                  {r.email ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{r.email}</p>
                                  ) : null}
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant={r.attendanceStatus === "present" ? "primary" : "outline"}
                                    onClick={() => mark(s.id, r.userId, "present")}
                                  >
                                    Asistió
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={r.attendanceStatus === "absent" ? "primary" : "outline"}
                                    onClick={() => mark(s.id, r.userId, "absent")}
                                  >
                                    Ausente
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
