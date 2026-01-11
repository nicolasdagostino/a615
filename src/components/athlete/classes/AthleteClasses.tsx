"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";

type ApiSession = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMin: number;
  capacity: number;
  reservedCount: number;
  remaining: number;
  status: string; // scheduled | full | cancelled
  notes: string | null;
  class: {
    id: string;
    name: string;
    coach: string;
    type: string; // crossfit | open-box | weightlifting | ...
  };
  reservedByMe: boolean;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function isoTodayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function monthLabel(m: number) {
  const labels = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  return labels[m - 1] ?? String(m);
}

function toUiType(type: string) {
  const s = (type || "").trim().toLowerCase();
  if (s === "crossfit") return "CrossFit";
  if (s === "open-box") return "Open Box";
  if (s === "weightlifting") return "Weightlifting";
  if (s === "gymnastics") return "Gymnastics";
  if (s === "kids") return "Kids";
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Class";
}

type TabKey = "today" | "my";

export default function AthleteClasses() {
  const [tab, setTab] = useState<TabKey>("today");

  // Hoy
  const [baseDate, setBaseDate] = useState<string>(isoTodayLocal());
  const [days, setDays] = useState<number>(1); // podés poner 7 si querés “próximas”
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // Mis reservas (mensual)
  const now = new Date();
  const [myYear, setMyYear] = useState<number>(now.getFullYear());
  const [myMonth, setMyMonth] = useState<number>(now.getMonth() + 1);

  // UI message (en vez de alert())
  const [uiMsg, setUiMsg] = useState<string | null>(null);

  // sync tab desde URL (?tab=my)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const t = (sp.get("tab") || "").toLowerCase();
    if (t === "my") setTab("my");
    if (t === "today") setTab("today");
  }, []);

  const fetchSessions = async (d: string, n: number) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/athlete/sessions?date=${encodeURIComponent(d)}&days=${encodeURIComponent(String(n))}`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(String(json?.error || "Failed"));
      const list = Array.isArray(json?.sessions) ? (json.sessions as ApiSession[]) : [];
      setSessions(list);
    } catch (e: any) {
      setSessions([]);
      setErr(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  // carga para tab “Hoy”
  useEffect(() => {
    if (tab !== "today") return;
    fetchSessions(baseDate, days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, baseDate, days]);

  // carga para tab “Mis reservas” (pide rango grande y filtra reservedByMe)
  useEffect(() => {
    if (tab !== "my") return;

    // tomamos el 1 del mes y pedimos 31 días (API limita a 31)
    const first = `${myYear}-${pad2(myMonth)}-01`;
    fetchSessions(first, 31);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, myYear, myMonth]);

  const myReserved = useMemo(() => {
    return sessions
      .filter((s) => s.reservedByMe)
      .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));
  }, [sessions]);

  const reserve = async (sessionId: string) => {
    setUiMsg(null);
    try {
      const res = await fetch("/api/athlete/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(String(json?.error || "No se pudo reservar"));
      // refresh
      if (tab === "today") await fetchSessions(baseDate, days);
      if (tab === "my") await fetchSessions(`${myYear}-${pad2(myMonth)}-01`, 31);
      setUiMsg("Reserva creada ✅");
    } catch (e: any) {
      setUiMsg(e?.message || "Error");
    }
  };

  const cancel = async (sessionId: string) => {
    setUiMsg(null);
    try {
      const res = await fetch("/api/athlete/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(String(json?.error || "No se pudo cancelar"));
      // refresh
      if (tab === "today") await fetchSessions(baseDate, days);
      if (tab === "my") await fetchSessions(`${myYear}-${pad2(myMonth)}-01`, 31);
      setUiMsg("Reserva cancelada ✅");
    } catch (e: any) {
      setUiMsg(e?.message || "Error");
    }
  };

  const TabButton = ({ k, label }: { k: TabKey; label: string }) => {
    const active = tab === k;
    return (
      <button
        type="button"
        onClick={() => {
          setTab(k);
          // opcional: reflejar en URL sin recargar
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("tab", k === "my" ? "my" : "today");
            window.history.replaceState({}, "", url.toString());
          }
        }}
        className={[
          "rounded-xl px-4 py-2 text-sm font-semibold transition",
          active
            ? "bg-brand-500 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
        ].join(" ")}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header + Tabs */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Clases</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Reservá y gestioná tus reservas desde acá.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <TabButton k="today" label="Hoy" />
            <TabButton k="my" label="Mis reservas" />
          </div>
        </div>

        {/* Filtros según tab */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {tab === "today" ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Fecha:
              </div>
              <input
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-theme-xs outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-transparent dark:text-white/90"
              />
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Días:
              </div>
              <select
                value={String(days)}
                onChange={(e) => setDays(Number(e.target.value))}
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-theme-xs outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-transparent dark:text-white/90"
              >
                <option value="1">1</option>
                <option value="3">3</option>
                <option value="7">7</option>
              </select>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-300">Mes:</div>
              <select
                value={String(myMonth)}
                onChange={(e) => setMyMonth(Number(e.target.value))}
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-theme-xs outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-transparent dark:text-white/90"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={String(m)}>{monthLabel(m)}</option>
                ))}
              </select>

              <div className="text-sm text-gray-600 dark:text-gray-300">Año:</div>
              <select
                value={String(myYear)}
                onChange={(e) => setMyYear(Number(e.target.value))}
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-theme-xs outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-transparent dark:text-white/90"
              >
                {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
          )}

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? "Cargando…" : null}
          </div>
        </div>

        {uiMsg ? (
          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
            {uiMsg}
          </div>
        ) : null}

        {err ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
            {err}
          </div>
        ) : null}
      </div>

      {/* Content */}
      {tab === "today" ? (
        <div className="space-y-3">
          {!loading && sessions.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
              No hay clases para el rango seleccionado.
            </div>
          ) : null}

          {sessions.map((s) => {
            const full = s.remaining <= 0 || String(s.status).toLowerCase() === "full";
            const cancelled = String(s.status).toLowerCase() === "cancelled";
            const reserved = s.reservedByMe;

            return (
              <div
                key={s.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                        {s.time}
                      </p>
                      <Badge size="sm" color={reserved ? "success" : "warning"}>
                        {reserved ? "Reservado" : "Disponible"}
                      </Badge>
                      {cancelled ? (
                        <Badge size="sm" color="error">Cancelada</Badge>
                      ) : null}

                    </div>

                    <p className="text-base font-semibold text-gray-900 dark:text-white/90">
                      {toUiType(s.class.type)} · {s.class.name}
                    </p>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {s.date} · Coach: <span className="font-medium">{s.class.coach}</span>{" "}
                      · Cupos: <span className="font-medium">{s.reservedCount}/{s.capacity}</span>
                      {s.notes ? <> · <span className="italic">{s.notes}</span></> : null}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {full && !reserved ? (
                      <span className="rounded-full bg-error-50 px-3 py-1 text-xs font-medium text-error-600 dark:bg-error-500/15 dark:text-error-500">
                        Completo
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600 dark:bg-green-500/15 dark:text-green-500">
                        Quedan {Math.max(0, s.remaining)}
                      </span>
                    )}

                    {!reserved ? (
                      <Button
                        variant="primary"
                        disabled={full || cancelled}
                        onClick={() => reserve(s.id)}
                      >
                        Reservar
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={() => cancel(s.id)}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {!loading && myReserved.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
              No tenés reservas en {monthLabel(myMonth)} {myYear}.
            </div>
          ) : null}

          {myReserved.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge size="sm" color="success">Reservado</Badge>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      {s.date} · {s.time}
                    </p>
                  </div>
                  <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white/90">
                    {toUiType(s.class.type)} · {s.class.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Coach: <span className="font-medium">{s.class.coach}</span>
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" onClick={() => cancel(s.id)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
