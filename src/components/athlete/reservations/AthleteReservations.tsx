"use client";

import React, { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";

type ApiSession = {
  id: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
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
    type: string;
  };
  reservedByMe: boolean;
};

function fmtDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

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

export default function AthleteReservations() {
  const cancelModal = useModal();

  const todayKey = useMemo(() => isoTodayMadrid(), []);

  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [loading, setLoading] = useState(true);

  const [pendingCancelSessionId, setPendingCancelSessionId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const selectedToCancel = useMemo(
    () => sessions.find((s) => s.id === pendingCancelSessionId) || null,
    [sessions, pendingCancelSessionId]
  );

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/athlete/sessions?date=${encodeURIComponent(todayKey)}&days=1`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(String(data?.error || "Failed to load sessions"));
      setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
    } catch (e: any) {
      setSessions([]);
      setToast(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reserve = async (sessionId: string) => {
    try {
      const res = await fetch("/api/athlete/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String(data?.error || "Failed"));

      setToast("✅ Reserva confirmada");
      await load();
    } catch (e: any) {
      setToast(String(e?.message || "Error"));
    }
  };

  const cancel = async (sessionId: string) => {
    try {
      const res = await fetch("/api/athlete/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String(data?.error || "Failed"));

      setToast("✅ Reserva cancelada");
      await load();
    } catch (e: any) {
      setToast(String(e?.message || "Error"));
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Clases de hoy</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {fmtDate(todayKey)} · Reservá tu clase con un toque.
            </p>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? "Cargando…" : `${sessions.length} sesiones`}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <div className="flex items-center justify-between gap-3">
            <span>{toast}</span>
            <button
              className="text-xs text-gray-500 hover:underline dark:text-gray-400"
              onClick={() => setToast(null)}
            >
              cerrar
            </button>
          </div>
        </div>
      ) : null}

      {/* Sessions */}
      <div className="space-y-3">
        {!loading && sessions.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
            Hoy no hay clases disponibles.
          </div>
        ) : null}

        {sessions.map((s) => {
          const full = s.remaining <= 0;

          return (
            <div
              key={s.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{s.time}</p>

                    <Badge color={s.class.type === "open-box" ? "warning" : "success"} size="sm">
                      {s.class.type}
                    </Badge>
                  </div>

                  <p className="text-base font-semibold text-gray-900 dark:text-white/90">
                    {s.class.name}
                  </p>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Coach: <span className="font-medium">{s.class.coach}</span> · Spots:{" "}
                    <span className="font-medium">
                      {s.reservedCount}/{s.capacity}
                    </span>
                  </p>

                  {s.notes ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Notas: {s.notes}</p>
                  ) : null}
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
                    <Button variant="primary" disabled={full} onClick={() => reserve(s.id)}>
                      Reservar
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPendingCancelSessionId(s.id);
                        cancelModal.openModal();
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModal.isOpen}
        onClose={() => {
          cancelModal.closeModal();
          setPendingCancelSessionId(null);
        }}
        className="max-w-[600px] p-5 lg:p-10"
      >
        <div className="text-center">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-title-sm">
            ¿Cancelar reserva?
          </h4>

          <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
            {selectedToCancel ? (
              <>
                Vas a cancelar <span className="font-semibold">{selectedToCancel.class.name}</span> (
                {selectedToCancel.time}).
              </>
            ) : (
              "Confirmá si querés cancelar esta reserva."
            )}
          </p>

          <div className="mt-7 flex w-full items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                cancelModal.closeModal();
                setPendingCancelSessionId(null);
              }}
              className="flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            >
              Volver
            </button>

            <button
              type="button"
              onClick={async () => {
                if (pendingCancelSessionId) await cancel(pendingCancelSessionId);
                cancelModal.closeModal();
                setPendingCancelSessionId(null);
              }}
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
