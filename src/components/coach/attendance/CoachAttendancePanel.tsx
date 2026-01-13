"use client";

import React, { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import type { BadgeColor } from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";

type Attendee = {
  reservationId: string;
  userId: string;
  email: string;
  role: string;
  attendanceStatus: "present" | "absent" | null;
};

type SessionRow = {
  id: string;
  date: string;
  time: string;
  status: string;
  capacity: number;
  class: { id: string; name: string; coach: string; type: string };
  attendees: Attendee[];
};

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

function fmtDateES(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d)}/${pad(m)}/${y}`;
}

function badgeForAttendance(st: Attendee["attendanceStatus"]): { label: string; color: BadgeColor } {
  if (st === "present") return { label: "Presente", color: "success" };
  if (st === "absent") return { label: "Ausente", color: "error" };
  return { label: "Pendiente", color: "warning" };
}

export default function CoachAttendancePanel() {
  const [dateISO, setDateISO] = useState<string>(() => isoTodayMadrid());
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [msg, setMsg] = useState<string>("");

  const load = async (d: string) => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/coach/attendance?date=${encodeURIComponent(d)}&days=1`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String((data as any)?.error || "No se pudo cargar asistencia"));
      setSessions(Array.isArray((data as any)?.sessions) ? (data as any).sessions : []);
    } catch (e: any) {
      console.error(e);
      setSessions([]);
      setMsg(e?.message || "Error cargando asistencia");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(dateISO);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMark = async (sessionId: string, userId: string, status: "present" | "absent") => {
    setMsg("");
    try {
      const res = await fetch("/api/coach/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ sessionId, userId, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String((data as any)?.error || "No se pudo marcar asistencia"));
      await load(dateISO);
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message || "Error marcando asistencia");
    }
  };

  const onResetSession = async (sessionId: string) => {
    setMsg("");
    try {
      const res = await fetch("/api/coach/attendance", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String((data as any)?.error || "No se pudo resetear asistencia"));
      await load(dateISO);
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message || "Error reseteando asistencia");
    }
  };

  const total = useMemo(() => sessions.length, [sessions.length]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Asistencia</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tomá lista por sesión. Esto alimenta el Historial del atleta.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dateISO}
              onChange={(e) => setDateISO(e.target.value)}
              className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
            <Button variant="primary" onClick={() => load(dateISO)} disabled={loading}>
              Ver día
            </Button>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Fecha: <span className="font-medium text-gray-700 dark:text-gray-200">{fmtDateES(dateISO)}</span> · Sesiones:{" "}
          <span className="font-medium text-gray-700 dark:text-gray-200">{total}</span>
        </div>

        {msg ? (
          <div className="mt-3 rounded-xl border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
            {msg}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
          Cargando…
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
          No hay sesiones para este día.
        </div>
      ) : (
        sessions.map((s) => (
          <div key={s.id} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-gray-900 dark:text-white/90">
                  {s.time} · {s.class?.name || "Sesión"}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Coach: <span className="font-medium text-gray-700 dark:text-gray-200">{s.class?.coach || "—"}</span>{" "}
                  · Reservas:{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">{s.attendees.length}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => onResetSession(s.id)}>
                  Reset asistencia
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {s.attendees.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">No hay reservas en esta sesión.</div>
              ) : (
                s.attendees.map((a) => {
                  const b = badgeForAttendance(a.attendanceStatus);
                  return (
                    <div
                      key={`${s.id}-${a.userId}`}
                      className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-gray-800 dark:text-white/90">{a.email || a.userId}</div>
                        <Badge size="sm" color={b.color}>
                          {b.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => onMark(s.id, a.userId, "absent")}>
                          Ausente
                        </Button>
                        <Button size="sm" variant="primary" onClick={() => onMark(s.id, a.userId, "present")}>
                          Presente
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
