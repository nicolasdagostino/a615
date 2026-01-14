"use client";

import React, { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import type { BadgeColor } from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import RoundedRibbon from "@/components/ui/ribbons/RoundedRibbon";

/** API shapes */
type ApiSession = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMin: number;
  capacity: number;
  reservedCount: number;
  remaining: number;
  status: string;
  notes?: string | null;
  class: {
    id: string;
    name: string;
    coach: string;
    type: string;
  };
  reservedByMe: boolean;
};

type HistorySession = {
  id: string;
  date: string;
  time: string;
  durationMin: number;
  capacity: number;
  status: string;
  notes?: string | null;
  class: {
    id: string;
    name: string;
    coach: string;
    type: string;
  };
  attendanceStatus: "present" | "absent" | null; // null = pendiente
};

type AttendeeLite = { userId: string; email: string | null; role: string | null };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function fmtDateES(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${pad2(d)}/${pad2(m)}/${y}`;
}

function fmtDDMM(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  return `${pad2(d)}/${pad2(m)}`;
}

function monthLabel(m: number) {
  const labels = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
  ];
  return labels[m - 1] ?? String(m);
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

/** Lunes de la semana (ISO) tomando como base un ISO YYYY-MM-DD */
function weekStartMondayISO(todayISO: string) {
  const [y, m, d] = todayISO.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d);
  const day = new Date(utc).getUTCDay(); // 0=Sun..6=Sat
  const offsetToMonday = (day + 6) % 7; // Mon=0..Sun=6
  const mondayUTC = utc - offsetToMonday * 24 * 60 * 60 * 1000;
  return new Date(mondayUTC).toISOString().slice(0, 10);
}

function addDaysISO(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d) + days * 24 * 60 * 60 * 1000;
  return new Date(utc).toISOString().slice(0, 10);
}

function badgeForAttendance(st: "present" | "absent" | null): { label: string; color: BadgeColor } {
  if (st === "present") return { label: "Attended", color: "success" };
  if (st === "absent") return { label: "Absent", color: "error" };
  return { label: "Pending", color: "info" };
}

function isScheduled(status: string) {
  return String(status || "").trim().toLowerCase() === "scheduled";
}

function ribbonColorClassFor(label: string) {
  const t = String(label || "").trim().toLowerCase();
  if (t.includes("crossfit")) return "bg-brand-500";
  if (t.includes("weight")) return "bg-purple-600";
  if (t.includes("kids")) return "bg-orange-500";
  if (t.includes("open")) return "bg-teal-600";
  if (t.includes("pay the man") || t.includes("pay")) return "bg-rose-600";
  return "bg-brand-500";
}

export default function AthleteClasses() {
  const [view, setView] = useState<"week" | "history">("week");

  // Hoy (Madrid)
  const [todayISO, setTodayISO] = useState<string>(() => isoTodayMadrid());

  // Week vigente
  const [weekStartISO, setWeekStartISO] = useState<string>(() => weekStartMondayISO(isoTodayMadrid()));
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysISO(weekStartISO, i)), [weekStartISO]);

  // Tab activo: por defecto hoy
  const [activeDayISO, setActiveDayISO] = useState<string>(() => isoTodayMadrid());

  // History mensual
  const now = useMemo(() => new Date(), []);
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1;
  const [year, setYear] = useState<number>(defaultYear);
  const [month, setMonth] = useState<number>(defaultMonth);

  // Data
  const [sessionsWeek, setSessionsWeek] = useState<ApiSession[]>([]);
  const [historyMonth, setHistoryMonth] = useState<HistorySession[]>([]);
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Confirm modals
  const reserveModal = useModal();
  const cancelModal = useModal();
  const [target, setTarget] = useState<ApiSession | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Details modal
  const detailsModal = useModal();
  const [detailsSession, setDetailsSession] = useState<ApiSession | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsMsg, setDetailsMsg] = useState("");
  const [attendees, setAttendees] = useState<AttendeeLite[]>([]);

  const loadWeek = async (mondayISO: string) => {
    setLoadingWeek(true);
    try {
      const res = await fetch(`/api/athlete/sessions?date=${encodeURIComponent(mondayISO)}&days=7`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String((data as any)?.error || "Failed to load sessions"));
      const list = Array.isArray((data as any)?.sessions) ? (data as any).sessions : [];
      setSessionsWeek(list as ApiSession[]);
    } catch (e) {
      console.error(e);
      setSessionsWeek([]);
    } finally {
      setLoadingWeek(false);
    }
  };

  const loadHistory = async (yy: number, mm: number) => {
    setLoadingHistory(true);
    try {
      const monthStr = `${yy}-${pad2(mm)}`;
      const res = await fetch(`/api/athlete/history?month=${encodeURIComponent(monthStr)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String((data as any)?.error || "Failed to load history"));
      const list = Array.isArray((data as any)?.sessions) ? (data as any).sessions : [];
      setHistoryMonth(list as HistorySession[]);
    } catch (e) {
      console.error(e);
      setHistoryMonth([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    const t = isoTodayMadrid();
    setTodayISO(t);

    const monday = weekStartMondayISO(t);
    setWeekStartISO(monday);

    setActiveDayISO(t);
    loadWeek(monday);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (view !== "history") return;
    loadHistory(year, month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, year, month]);

  const sessionsByDay = useMemo(() => {
    const map: Record<string, ApiSession[]> = {};
    for (const d of weekDays) map[d] = [];
    for (const s of sessionsWeek) {
      const key = String(s.date);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    for (const d of Object.keys(map)) {
      map[d] = map[d].slice().sort((a, b) => a.time.localeCompare(b.time));
    }
    return map;
  }, [sessionsWeek, weekDays]);

  const daySessions = sessionsByDay[activeDayISO] ?? [];

  const historySorted = useMemo(() => {
    const today = todayISO;
    return [...historyMonth]
      .filter((s) => String(s.date) < String(today))
      .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));
  }, [historyMonth, todayISO]);

  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: monthLabel(i + 1) })),
    []
  );

  const yearOptions = useMemo(() => {
    const y = defaultYear;
    return [y, y - 1, y - 2, y - 3].map((v) => v);
  }, [defaultYear]);

  const openReserve = (s: ApiSession) => {
    setErrorMsg("");
    setTarget(s);
    reserveModal.openModal();
  };

  const openCancel = (s: ApiSession) => {
    setErrorMsg("");
    setTarget(s);
    cancelModal.openModal();
  };

  const doReserve = async () => {
    if (!target) return;
    setErrorMsg("");
    try {
      const res = await fetch("/api/athlete/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ sessionId: target.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(String((data as any)?.error || "Could not reserve"));
        return;
      }
      reserveModal.closeModal();
      setTarget(null);
      await loadWeek(weekStartISO);
    } catch (e) {
      console.error(e);
      setErrorMsg("Could not reserve");
    }
  };

  const doCancel = async () => {
    if (!target) return;
    setErrorMsg("");
    try {
      const res = await fetch("/api/athlete/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ sessionId: target.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(String((data as any)?.error || "Could not cancel"));
        return;
      }
      cancelModal.closeModal();
      setTarget(null);
      await loadWeek(weekStartISO);
    } catch (e) {
      console.error(e);
      setErrorMsg("Could not cancel");
    }
  };

  const openDetails = async (s: ApiSession) => {
    setDetailsSession(s);
    setAttendees([]);
    setDetailsMsg("");
    setDetailsLoading(true);
    detailsModal.openModal();

    try {
      const res = await fetch(`/api/athlete/attendees?sessionId=${encodeURIComponent(s.id)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String((data as any)?.error || "Could not load attendees"));
      const list = Array.isArray((data as any)?.attendees) ? (data as any).attendees : [];
      setAttendees(list as AttendeeLite[]);
    } catch (e: any) {
      console.error(e);
      setDetailsMsg(e?.message || "Error loading attendees");
    } finally {
      setDetailsLoading(false);
    }
  };

  const weekCount = useMemo(() => sessionsWeek.length, [sessionsWeek.length]);
  const historyCount = useMemo(() => historySorted.length, [historySorted.length]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Sessions</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Book and manage your classes. You can see who signed up for each session.
            </p>
          </div>

          {/* Week / History */}
          <div className="grid grid-cols-2 items-center gap-x-1 gap-y-2 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
            <button
              onClick={() => setView("week")}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium hover:text-gray-900 dark:hover:text-white ${
                view === "week" ? "bg-white text-gray-900 dark:bg-gray-800 dark:text-white" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Week
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium leading-normal ${
                view === "week" ? "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400" : "bg-white dark:bg-white/[0.03]"
              }`}>
                {weekCount}
              </span>
            </button>

            <button
              onClick={() => setView("history")}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium hover:text-gray-900 dark:hover:text-white ${
                view === "history" ? "bg-white text-gray-900 dark:bg-gray-800 dark:text-white" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              History
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium leading-normal ${
                view === "history" ? "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400" : "bg-white dark:bg-white/[0.03]"
              }`}>
                {historyCount}
              </span>
            </button>
          </div>
        </div>

        <div className="p-5">
          {view === "week" ? (
            <div className="space-y-4">
              {/* Tabs horizontales dd/mm */}
              <div className="overflow-x-auto pb-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-100 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-track]:bg-white dark:[&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1.5">
                <nav className="flex w-full flex-row gap-2">
                  {weekDays.map((d) => {
                    const active = d === activeDayISO;
                    return (
                      <button
                        key={d}
                        onClick={() => setActiveDayISO(d)}
                        className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                          active
                            ? "bg-brand-50 text-brand-500 dark:bg-brand-400/20 dark:text-brand-400"
                            : "bg-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                      >
                        {fmtDDMM(d)}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>
                  Selected day:{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">{fmtDateES(activeDayISO)}</span>
                </span>
                <button
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  onClick={() => loadWeek(weekStartISO)}
                  disabled={loadingWeek}
                >
                  Reload
                </button>
              </div>

              {loadingWeek ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                  Loading sessions…
                </div>
              ) : daySessions.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                  No sessions for this day.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {daySessions.map((s) => {
                    const ribbonLabel = (s.class?.name || s.class?.type || "Session").trim();
                    const full = (s.remaining ?? 0) <= 0;
                    const disabledReserve = full || !isScheduled(s.status);

                    return (
                      <div key={s.id} className="relative">
                        {/* Time badge arriba derecha */}
                        <div className="absolute right-4 top-4 z-10">
                          <Badge size="sm" color="info">
                            {s.time}
                          </Badge>
                        </div>

                        <RoundedRibbon label={ribbonLabel} ribbonClassName={ribbonColorClassFor(ribbonLabel)} className="h-full">
                          <div className="p-5 pt-16 sm:p-6 sm:pt-16">
                            <div className="space-y-2">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Coach:{" "}
                                <span className="font-medium text-gray-700 dark:text-gray-200">
                                  {s.class?.coach || "—"}
                                </span>
                              </p>

                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Cupos:{" "}
                                <span className="font-medium text-gray-700 dark:text-gray-200">
                                  {s.reservedCount}/{s.capacity}
                                </span>
                                {isScheduled(s.status) ? (
                                  <span className="ml-2">
                                    ·{" "}
                                    <span className={`font-medium ${full ? "text-error-600 dark:text-error-400" : "text-green-600 dark:text-green-400"}`}>
                                      {full ? "Full" : `Left ${s.remaining}`}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="ml-2">
                                    · <span className="font-medium text-error-600 dark:text-error-400">Cancelled</span>
                                  </span>
                                )}
                              </p>

                              {s.notes ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {s.notes}
                                </p>
                              ) : null}

                              <div className="mt-4 flex flex-wrap items-center gap-2">
                                {!s.reservedByMe ? (
                                  <Button
                                    variant="primary"
                                    disabled={disabledReserve}
                                    onClick={() => openReserve(s)}
                                  >
                                    Reserve
                                  </Button>
                                ) : (
                                  <Button variant="outline" onClick={() => openCancel(s)}>
                                    Cancel
                                  </Button>
                                )}

                                <Button variant="outline" onClick={() => openDetails(s)}>
                                  Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        </RoundedRibbon>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            // History (igual que antes)
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select
                      className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      value={String(month)}
                      onChange={(e) => setMonth(Number(e.target.value))}
                    >
                      {monthOptions.map((o) => (
                        <option key={o.value} value={o.value} className="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">▾</span>
                  </div>

                  <div className="relative">
                    <select
                      className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      value={String(year)}
                      onChange={(e) => setYear(Number(e.target.value))}
                    >
                      {yearOptions.map((y) => (
                        <option key={y} value={y} className="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                          {y}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">▾</span>
                  </div>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400 sm:text-right">
                  Sessions pasadas (asistencia)
                </div>
              </div>

              {loadingHistory ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                  Loading history…
                </div>
              ) : historySorted.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                  No history for {monthLabel(month)} {year}.
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                  <Table>
                    <TableHeader className="border-y border-gray-200 dark:border-gray-800">
                      <TableRow>
                        <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Date
                        </TableCell>
                        <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Time
                        </TableCell>
                        <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Class
                        </TableCell>
                        <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Coach
                        </TableCell>
                        <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Attendance
                        </TableCell>
                      </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {historySorted.map((s) => {
                        const att = badgeForAttendance(s.attendanceStatus);
                        return (
                          <TableRow key={s.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-900">
                            <TableCell className="px-5 py-4 whitespace-nowrap">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {fmtDateES(s.date)}
                              </p>
                            </TableCell>

                            <TableCell className="px-5 py-4 whitespace-nowrap">
                              <p className="text-sm text-gray-500 dark:text-gray-400">{s.time}</p>
                            </TableCell>

                            <TableCell className="px-5 py-4 whitespace-nowrap">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {s.class?.name || "Session"}
                              </p>
                            </TableCell>

                            <TableCell className="px-5 py-4 whitespace-nowrap">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {s.class?.coach || "—"}
                              </p>
                            </TableCell>

                            <TableCell className="px-5 py-4 whitespace-nowrap">
                              <Badge size="sm" color={att.color}>{att.label}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reserve modal */}
      <Modal isOpen={reserveModal.isOpen} onClose={reserveModal.closeModal} className="max-w-[600px] p-5 lg:p-10 m-4">
        <div className="text-center">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-title-sm">
            Confirm reservation
          </h4>

          {target ? (
            <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
              Do you want to reserve a spot in{" "}
              <span className="font-semibold text-gray-800 dark:text-white/90">
                {target.class?.type || target.class?.name || "Session"}
              </span>{" "}
              · {fmtDateES(target.date)} · {target.time}?
            </p>
          ) : null}

          {errorMsg ? <p className="mt-3 text-sm text-error-600 dark:text-error-500">{errorMsg}</p> : null}

          <div className="mt-7 flex w-full items-center justify-center gap-3">
            <button
              type="button"
              onClick={reserveModal.closeModal}
              className="flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={doReserve}
              className="flex justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel modal */}
      <Modal isOpen={cancelModal.isOpen} onClose={cancelModal.closeModal} className="max-w-[600px] p-5 lg:p-10 m-4">
        <div className="text-center">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-title-sm">
            ¿Cancel reserva?
          </h4>

          {target ? (
            <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
              You’re about to cancel{" "}
              <span className="font-semibold text-gray-800 dark:text-white/90">
                {target.class?.type || target.class?.name || "Session"}
              </span>{" "}
              · {fmtDateES(target.date)} · {target.time}.
            </p>
          ) : null}

          {errorMsg ? <p className="mt-3 text-sm text-error-600 dark:text-error-500">{errorMsg}</p> : null}

          <div className="mt-7 flex w-full items-center justify-center gap-3">
            <button
              type="button"
              onClick={cancelModal.closeModal}
              className="flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            >
              Back
            </button>

            <button
              type="button"
              onClick={doCancel}
              className="flex justify-center rounded-lg bg-error-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-error-600"
            >
              Sí, cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Details modal */}
      <Modal isOpen={detailsModal.isOpen} onClose={detailsModal.closeModal} className="max-w-[700px] p-5 lg:p-10 m-4">
        <div className="space-y-4">
          <div>
            <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-title-sm">
              Attendees
            </h4>
            {detailsSession ? (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {detailsSession.class?.type || detailsSession.class?.name || "Session"} · {fmtDateES(detailsSession.date)} · {detailsSession.time}
              </p>
            ) : null}
          </div>

          {detailsMsg ? (
            <div className="rounded-xl border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
              {detailsMsg}
            </div>
          ) : null}

          {detailsLoading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
              Cargando…
            </div>
          ) : attendees.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
              No attendees for this session.
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <Table>
                <TableHeader className="border-y border-gray-200 dark:border-gray-800">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </TableCell>
                    <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      Role
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {attendees.map((a) => (
                    <TableRow key={a.userId} className="transition hover:bg-gray-50 dark:hover:bg-gray-900">
                      <TableCell className="px-5 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {a.email || a.userId}
                        </p>
                      </TableCell>
                      <TableCell className="px-5 py-4 whitespace-nowrap">
                        <Badge size="sm" color="info">{a.role || "—"}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={detailsModal.closeModal}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
