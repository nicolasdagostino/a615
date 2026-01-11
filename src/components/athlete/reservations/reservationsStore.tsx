"use client";

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";

export type ApiSession = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMin: number;
  capacity: number;
  reservedCount: number;
  remaining: number;
  status: string;
  notes: string | null;
  class: {
    id: string;
    name: string;
    coach: string;
    type: string; // crossfit | open-box | ...
  };
  reservedByMe: boolean;
};

type SessionsResp = {
  ok: boolean;
  date: string;
  days: number;
  sessions: ApiSession[];
  error?: string;
};

type ReservationsState = {
  // data
  sessions: ApiSession[];
  loading: boolean;
  error: string | null;

  // derived
  isReserved: (sessionId: string) => boolean;
  remainingSpots: (sessionId: string) => number;

  // actions
  refresh: (opts?: { date?: string; days?: number }) => Promise<void>;
  reserve: (sessionId: string) => Promise<{ ok: true } | { ok: false; reason: string }>;
  cancel: (sessionId: string) => Promise<{ ok: true } | { ok: false; reason: string }>;

  // last query (para refrescar tras reservar/cancelar)
  lastDate: string;
  lastDays: number;
};

// YYYY-MM-DD en Europe/Madrid (importante para que “hoy” coincida con tu lógica)
function isoDateMadrid(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const dd = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${dd}`;
}

const ReservationsContext = createContext<ReservationsState | null>(null);

export function ReservationsProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lastDate, setLastDate] = useState<string>(() => isoDateMadrid(new Date()));
  const [lastDays, setLastDays] = useState<number>(1);

  const refresh = useCallback(async (opts?: { date?: string; days?: number }) => {
    const date = (opts?.date || lastDate || isoDateMadrid(new Date())).trim();
    const days = Math.max(1, Math.min(31, Number(opts?.days ?? lastDays ?? 1)));

    setLastDate(date);
    setLastDays(days);

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/athlete/sessions?date=${encodeURIComponent(date)}&days=${encodeURIComponent(String(days))}`, {
        cache: "no-store",
      });
      const json = (await res.json().catch(() => ({}))) as SessionsResp;

      if (!res.ok) {
        setSessions([]);
        setError(String((json as any)?.error || "Failed to load sessions"));
        return;
      }

      setSessions(Array.isArray((json as any)?.sessions) ? (json as any).sessions : []);
    } catch (e: any) {
      setSessions([]);
      setError(e?.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, [lastDate, lastDays]);

  // carga inicial: “hoy” Madrid, 1 día
  useEffect(() => {
    refresh({ date: isoDateMadrid(new Date()), days: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isReserved = (sessionId: string) => sessions.some((s) => s.id === sessionId && Boolean(s.reservedByMe));

  const remainingSpots = (sessionId: string) => {
    const s = sessions.find((x) => x.id === sessionId);
    if (!s) return 0;
    return Math.max(0, Number(s.remaining ?? (Number(s.capacity) - Number(s.reservedCount))));
  };

  const reserve = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch("/api/athlete/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        return { ok: false as const, reason: String(json?.error || "No se pudo reservar") };
      }

      // refrescar para actualizar counts + reservedByMe
      await refresh({ date: lastDate, days: lastDays });
      return { ok: true as const };
    } catch (e: any) {
      return { ok: false as const, reason: e?.message || "No se pudo reservar" };
    }
  }, [refresh, lastDate, lastDays]);

  const cancel = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch("/api/athlete/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        return { ok: false as const, reason: String(json?.error || "No se pudo cancelar") };
      }

      await refresh({ date: lastDate, days: lastDays });
      return { ok: true as const };
    } catch (e: any) {
      return { ok: false as const, reason: e?.message || "No se pudo cancelar" };
    }
  }, [refresh, lastDate, lastDays]);

  const value = useMemo<ReservationsState>(() => {
    return {
      sessions,
      loading,
      error,
      isReserved,
      remainingSpots,
      refresh,
      reserve,
      cancel,
      lastDate,
      lastDays,
    };
  }, [sessions, loading, error, reserve, cancel, refresh, lastDate, lastDays]);

  return <ReservationsContext.Provider value={value}>{children}</ReservationsContext.Provider>;
}

export function useReservations() {
  const ctx = useContext(ReservationsContext);
  if (!ctx) throw new Error("useReservations must be used within ReservationsProvider");
  return ctx;
}
