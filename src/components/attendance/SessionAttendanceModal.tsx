"use client";

import { useEffect, useMemo, useState } from "react";

type StaffRosterRow = {
  reservationId?: string;
  userId: string;
  email?: string | null;
  role?: string | null;
  attendanceStatus: "present" | "absent" | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  staffMode: boolean;
  sessionId: string | null;
  sessionLabel: string;
};

function normStatus(s: any): "scheduled" | "completed" | string {
  const t = String(s || "").trim().toLowerCase();
  return (t as any) || "scheduled";
}

export default function SessionAttendanceModal({ open, onClose, staffMode, sessionId, sessionLabel }: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [roster, setRoster] = useState<StaffRosterRow[]>([]);
  const [sessionStatus, setSessionStatus] = useState<string>("scheduled");

  const isCompleted = useMemo(() => normStatus(sessionStatus) === "completed", [sessionStatus]);

  useEffect(() => {
    if (!open) return;
    if (!staffMode) {
      setRoster([]);
      setErr(null);
      setLoading(false);
      setSessionStatus("scheduled");
      return;
    }
    if (!sessionId) return;

    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/coach/attendance?sessionId=${encodeURIComponent(sessionId)}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "No se pudo cargar asistencia");

        const statusFromApi = json?.session?.status ?? "scheduled";
        if (alive) setSessionStatus(String(statusFromApi || "scheduled"));

        const list = Array.isArray(json?.session?.attendees) ? json.session.attendees : [];
        const normalized: StaffRosterRow[] = list.map((r: any) => ({
          reservationId: r.reservationId ? String(r.reservationId) : undefined,
          userId: String(r.userId),
          email: r.email ? String(r.email) : null,
          role: r.role ? String(r.role) : null,
          attendanceStatus:
            r.attendanceStatus === "present" ? "present" : r.attendanceStatus === "absent" ? "absent" : null,
        }));

        if (alive) setRoster(normalized);
      } catch (e: any) {
        if (alive) setErr(String(e?.message || "Error"));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, staffMode, sessionId]);

  const setOne = async (userId: string, status: "present" | "absent") => {
    if (!sessionId) return;
    setErr(null);

    // optimistic
    setRoster((prev) => prev.map((x) => (x.userId === userId ? { ...x, attendanceStatus: status } : x)));

    const res = await fetch("/api/coach/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, userId, status }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      // rollback simple
      setRoster((prev) => prev.map((x) => (x.userId === userId ? { ...x, attendanceStatus: null } : x)));
      throw new Error(json?.error || "No se pudo guardar asistencia");
    }
  };

  const resetAll = async () => {
    if (!sessionId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/coach/attendance", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "No se pudo resetear asistencia");
      setRoster((prev) => prev.map((x) => ({ ...x, attendanceStatus: null })));
    } catch (e: any) {
      setErr(String(e?.message || "Error"));
    } finally {
      setLoading(false);
    }
  };

  const markAllPresent = async () => {
    if (!sessionId) return;
    setLoading(true);
    setErr(null);
    try {
      for (const r of roster) {
        await setOne(r.userId, "present");
      }
    } catch (e: any) {
      setErr(String(e?.message || "Error marcando todos"));
    } finally {
      setLoading(false);
    }
  };

  const toggleClose = async () => {
    if (!sessionId) return;
    setLoading(true);
    setErr(null);
    try {
      const action = isCompleted ? "reopen" : "close";
      const res = await fetch("/api/coach/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "No se pudo actualizar el estado de la sesión");

      // backend puede devolver status; si no, inferimos por action
      const nextStatus = String(json?.session?.status || (action === "close" ? "completed" : "scheduled"));
      setSessionStatus(nextStatus);
    } catch (e: any) {
      setErr(String(e?.message || "Error"));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Asistencia</h3>

              {staffMode && (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    isCompleted
                      ? "bg-gray-200 text-gray-800 dark:bg-white/10 dark:text-white/80"
                      : "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
                  }`}
                >
                  {isCompleted ? "Clase finalizada" : "Clase abierta"}
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sesión: <span className="text-gray-800 dark:text-white/90">{sessionLabel || "—"}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
          >
            Cerrar
          </button>
        </div>

        {staffMode && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={markAllPresent}
              disabled={loading || !roster.length}
              className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              title={!roster.length ? "No hay reservas" : ""}
            >
              Marcar todos presentes
            </button>

            <button
              onClick={resetAll}
              disabled={loading}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/10"
            >
              Reset
            </button>

            <button
              onClick={toggleClose}
              disabled={loading}
              className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 ${
                isCompleted
                  ? "border border-gray-200 text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-white/10"
                  : "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
              }`}
              title={isCompleted ? "Reabrir para permitir cambios/acciones" : "Finalizar para cerrar reservas/cancelaciones"}
            >
              {isCompleted ? "Reabrir clase" : "Finalizar clase"}
            </button>
          </div>
        )}

        {err && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200">
            {err}
          </div>
        )}

        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Cargando…</p>
          ) : (
            <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
              {roster.map((r) => (
                <div key={r.userId} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                      {r.email || r.userId}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{r.role || ""}</p>
                  </div>

                  {staffMode ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        disabled={loading}
                        onClick={async () => {
                          try {
                            await setOne(r.userId, "present");
                          } catch (e: any) {
                            setErr(String(e?.message || "Error"));
                          }
                        }}
                        className={`rounded-lg px-3 py-1.5 text-sm ${
                          r.attendanceStatus === "present"
                            ? "bg-green-600 text-white"
                            : "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/10"
                        }`}
                      >
                        Presente
                      </button>

                      <button
                        disabled={loading}
                        onClick={async () => {
                          try {
                            await setOne(r.userId, "absent");
                          } catch (e: any) {
                            setErr(String(e?.message || "Error"));
                          }
                        }}
                        className={`rounded-lg px-3 py-1.5 text-sm ${
                          r.attendanceStatus === "absent"
                            ? "bg-red-600 text-white"
                            : "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/10"
                        }`}
                      >
                        Ausente
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {r.attendanceStatus ? r.attendanceStatus : "—"}
                    </span>
                  )}
                </div>
              ))}

              {!roster.length && (
                <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No hay reservas en esta sesión.
                </div>
              )}
            </div>
          )}
        </div>

        {staffMode && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Tip: si la clase está finalizada, el atleta no puede reservar ni cancelar. Podés reabrir si necesitás corregir algo.
          </p>
        )}
      </div>
    </div>
  );
}
