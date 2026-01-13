"use client";

import React, { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import type { BadgeColor } from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";

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

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function fmtDateES(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${pad2(d)}/${pad2(m)}/${y}`;
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

function badgeForType(type: string): { label: string; color: BadgeColor } {
  const t = (type || "").trim().toLowerCase();
  if (t === "open-box" || t === "open box") return { label: "Open Box", color: "warning" };
  if (t === "weightlifting") return { label: "Weightlifting", color: "success" };
  if (t === "gymnastics") return { label: "Gymnastics", color: "info" };
  if (t === "crossfit") return { label: "CrossFit", color: "success" };
  return { label: type || "Clase", color: "warning" };
}

function badgeForStatus(status: string): { label: string; color: BadgeColor } {
  const s = (status || "").trim().toLowerCase();
  if (s === "scheduled") return { label: "Programada", color: "success" };
  if (s === "full") return { label: "Completa", color: "warning" };
  if (s === "cancelled") return { label: "Cancelada", color: "error" };
  return { label: status || "Estado", color: "warning" };
}

function badgeForAttendance(st: "present" | "absent" | null): { label: string; color: BadgeColor } {
  if (st === "present") return { label: "Asistió", color: "success" };
  if (st === "absent") return { label: "Ausente", color: "error" };
  return { label: "Pendiente", color: "info" };
}

export default function AthleteClasses() {
  const [tab, setTab] = useState<"today" | "history">("today");

  // Hoy (Madrid)
  const [todayISO, setTodayISO] = useState<string>(() => isoTodayMadrid());

  // Historial mensual
  const now = useMemo(() => new Date(), []);
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1;

  const [year, setYear] = useState<number>(defaultYear);
  const [month, setMonth] = useState<number>(defaultMonth);

  // Data
  const [sessionsToday, setSessionsToday] = useState<ApiSession[]>([]);
  const [historyMonth, setHistoryMonth] = useState<HistorySession[]>([]);
  const [loadingToday, setLoadingToday] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modals confirm
  const reserveModal = useModal();
  const cancelModal = useModal();
  const [target, setTarget] = useState<ApiSession | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const loadToday = async (dateISO: string) => {
    setLoadingToday(true);
    try {
      const res = await fetch(`/api/athlete/sessions?date=${encodeURIComponent(dateISO)}&days=1`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String((data as any)?.error || "Failed to load sessions"));
      const list = Array.isArray((data as any)?.sessions) ? (data as any).sessions : [];
      setSessionsToday(list as ApiSession[]);
    } catch (e) {
      console.error(e);
      setSessionsToday([]);
    } finally {
      setLoadingToday(false);
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
    loadToday(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab !== "history") return;
    loadHistory(year, month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, year, month]);

  const todaySorted = useMemo(() => {
    return [...sessionsToday].sort((a, b) => a.time.localeCompare(b.time));
  }, [sessionsToday]);

  const historySorted = useMemo(() => {
  // Historial = sesiones pasadas (no futuras), ordenadas
  const today = todayISO;
  return [...historyMonth]
    .filter((s) => String(s.date) < String(today))
    .sort((a, b) =>
      a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)
    );
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
        setErrorMsg(String((data as any)?.error || "No se pudo reservar"));
        return;
      }
      reserveModal.closeModal();
      setTarget(null);
      await loadToday(todayISO);
    } catch (e) {
      console.error(e);
      setErrorMsg("No se pudo reservar");
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
        setErrorMsg(String((data as any)?.error || "No se pudo cancelar"));
        return;
      }
      cancelModal.closeModal();
      setTarget(null);
      await loadToday(todayISO);
    } catch (e) {
      console.error(e);
      setErrorMsg("No se pudo cancelar");
    }
  };

  const tabItems = useMemo(() => {
    return [
      { key: "today" as const, name: "Hoy", count: todaySorted.length },
      { key: "history" as const, name: "Historial", count: historySorted.length },
    ];
  }, [todaySorted.length, historySorted.length]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Sesiones</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Reservá y gestioná tus clases. El historial muestra asistencia.
            </p>
          </div>

          <div className="grid grid-cols-2 items-center gap-x-1 gap-y-2 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
            {tabItems.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md group hover:text-gray-900 dark:hover:text-white ${
                  tab === t.key
                    ? "text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {t.name}
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium leading-normal group-hover:bg-brand-50 group-hover:text-brand-500 dark:group-hover:bg-brand-500/15 dark:group-hover:text-brand-400 ${
                    tab === t.key
                      ? "text-brand-500 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/15"
                      : "bg-white dark:bg-white/[0.03]"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {tab === "today" ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">{fmtDateES(todayISO)}</div>

              {loadingToday ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                  Cargando sesiones…
                </div>
              ) : todaySorted.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                  No hay sesiones cargadas para hoy.
                </div>
              ) : (
                todaySorted.map((s) => {
  const type = badgeForType(s.class?.type);
  const status = badgeForStatus(s.status);
  const full = (s.remaining ?? 0) <= 0;

  return (
    <div
      key={s.id}
      className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {s.time}
            </p>
            <Badge size="sm" color={type.color}>{type.label}</Badge>
            <Badge size="sm" color={status.color}>{status.label}</Badge>
          </div>

          <p className="text-base font-semibold text-gray-900 dark:text-white/90">
            {s.class?.name || "Sesión"}
          </p>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Coach:{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {s.class?.coach || "—"}
            </span>{" "}
            · Cupos:{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {s.reservedCount}/{s.capacity}
            </span>
            {s.notes ? <span> · {s.notes}</span> : null}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {full ? (
            <span className="rounded-full bg-error-50 px-3 py-1 text-xs font-medium text-error-600 dark:bg-error-500/15 dark:text-error-500">
              Completo
            </span>
          ) : (
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600 dark:bg-green-500/15 dark:text-green-500">
              Quedan {s.remaining}
            </span>
          )}

          {!s.reservedByMe ? (
            <Button
              variant="primary"
              disabled={full || String(s.status).toLowerCase() !== "scheduled"}
              onClick={() => openReserve(s)}
            >
              Reservar
            </Button>
          ) : (
            <Button variant="outline" onClick={() => openCancel(s)}>
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}))}
            </div>
          ) : (
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
                  Sesiones pasadas (asistencia)
                </div>
              </div>

              {loadingHistory ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                  Cargando historial…
                </div>
              ) : historySorted.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                  No hay historial en {monthLabel(month)} {year}.
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                  <Table>
                    <TableHeader className="border-y border-gray-200 dark:border-gray-800">
                      <TableRow>
                        <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Fecha
                        </TableCell>
                        <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Hora
                        </TableCell>
                        <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Clase
                        </TableCell>
                        <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Coach
                        </TableCell>
                        <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Tipo
                        </TableCell>
                        <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Asistencia
                        </TableCell>
                      </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {historySorted.map((s) => {
                        const type = badgeForType(s.class?.type);
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
                                {s.class?.name || "Sesión"}
                              </p>
                            </TableCell>

                            <TableCell className="px-5 py-4 whitespace-nowrap">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {s.class?.coach || "—"}
                              </p>
                            </TableCell>

                            <TableCell className="px-5 py-4 whitespace-nowrap">
                              <Badge size="sm" color={type.color}>{type.label}</Badge>
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
            Confirmar reserva
          </h4>

          {target ? (
            <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
              ¿Querés reservarte en{" "}
              <span className="font-semibold text-gray-800 dark:text-white/90">
                {target.class?.name || "Sesión"}
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
              Cancelar
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
            ¿Cancelar reserva?
          </h4>

          {target ? (
            <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
              Vas a cancelar{" "}
              <span className="font-semibold text-gray-800 dark:text-white/90">
                {target.class?.name || "Sesión"}
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
              Volver
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
    </div>
  );
}
