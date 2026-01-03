"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import type { ClassSession, Reservation } from "./reservationsMock";
import { sessionsMock, reservationsMock } from "./reservationsMock";

type ReservationsState = {
  athleteId: number;
  sessions: ClassSession[];
  reservations: Reservation[];

  isReserved: (sessionId: number) => boolean;
  remainingSpots: (sessionId: number) => number;

  reserve: (sessionId: number) => { ok: true } | { ok: false; reason: string };
  cancel: (sessionId: number) => void;
};

const ReservationsContext = createContext<ReservationsState | null>(null);

export function ReservationsProvider({ children }: { children: React.ReactNode }) {
  const athleteId = 1;

  const [sessions, setSessions] = useState<ClassSession[]>(sessionsMock);
  const [reservations, setReservations] = useState<Reservation[]>(
    reservationsMock.filter((r) => r.athleteId === athleteId)
  );

  const isReserved = (sessionId: number) => reservations.some((r) => r.sessionId === sessionId);

  const remainingSpots = (sessionId: number) => {
    const s = sessions.find((x) => x.id === sessionId);
    if (!s) return 0;
    return Math.max(0, s.capacity - s.reservedCount);
  };

  const reserve = (sessionId: number) => {
    const s = sessions.find((x) => x.id === sessionId);
    if (!s) return { ok: false, reason: "Clase no encontrada." };
    if (isReserved(sessionId)) return { ok: false, reason: "Ya estás reservado." };
    if (remainingSpots(sessionId) <= 0) return { ok: false, reason: "La clase está completa." };

    // regla simple de solapamiento: no reservar mismo date+time
    const hasOverlap = reservations.some((r) => {
      const rs = sessions.find((x) => x.id === r.sessionId);
      return rs && rs.date === s.date && rs.time === s.time;
    });
    if (hasOverlap) return { ok: false, reason: "Ya tenés una clase en ese horario." };

    const newRes: Reservation = {
      id: Date.now(),
      athleteId,
      sessionId,
      createdAt: new Date().toISOString(),
    };

    setReservations((prev) => [newRes, ...prev]);
    setSessions((prev) =>
      prev.map((x) => (x.id === sessionId ? { ...x, reservedCount: x.reservedCount + 1 } : x))
    );

    return { ok: true as const };
  };

  const cancel = (sessionId: number) => {
    if (!isReserved(sessionId)) return;

    setReservations((prev) => prev.filter((r) => r.sessionId !== sessionId));
    setSessions((prev) =>
      prev.map((x) => (x.id === sessionId ? { ...x, reservedCount: Math.max(0, x.reservedCount - 1) } : x))
    );
  };

  const value = useMemo<ReservationsState>(
    () => ({
      athleteId,
      sessions,
      reservations,
      isReserved,
      remainingSpots,
      reserve,
      cancel,
    }),
    [sessions, reservations]
  );

  return <ReservationsContext.Provider value={value}>{children}</ReservationsContext.Provider>;
}

export function useReservations() {
  const ctx = useContext(ReservationsContext);
  if (!ctx) throw new Error("useReservations must be used within ReservationsProvider");
  return ctx;
}
