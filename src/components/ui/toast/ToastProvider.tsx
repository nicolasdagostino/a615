"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type ToastKind = "success" | "error" | "info" | "warning";

export type ToastItem = {
  id: string;
  kind: ToastKind;
  title?: string;
  message: string;
  durationMs?: number;
};

type ToastContextValue = {
  push: (t: Omit<ToastItem, "id">) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function kindStyles(kind: ToastKind) {
  switch (kind) {
    case "success":
      return {
        badge: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
        border: "border-success-200 dark:border-success-500/20",
        dot: "bg-success-500",
        title: "text-gray-900 dark:text-white/90",
        msg: "text-gray-600 dark:text-gray-300",
      };
    case "error":
      return {
        badge: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
        border: "border-error-200 dark:border-error-500/20",
        dot: "bg-error-500",
        title: "text-gray-900 dark:text-white/90",
        msg: "text-gray-600 dark:text-gray-300",
      };
    case "warning":
      return {
        badge: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
        border: "border-warning-200 dark:border-warning-500/20",
        dot: "bg-warning-500",
        title: "text-gray-900 dark:text-white/90",
        msg: "text-gray-600 dark:text-gray-300",
      };
    default:
      return {
        badge: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500",
        border: "border-blue-light-200 dark:border-blue-light-500/20",
        dot: "bg-blue-light-500",
        title: "text-gray-900 dark:text-white/90",
        msg: "text-gray-600 dark:text-gray-300",
      };
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, number>>({});

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timers.current[id];
    if (t) window.clearTimeout(t);
    delete timers.current[id];
  }, []);

  const push = useCallback(
    (t: Omit<ToastItem, "id">) => {
      const id = uid();
      const durationMs = typeof t.durationMs === "number" ? t.durationMs : 2600;
      const toast: ToastItem = { ...t, id, durationMs };

      setToasts((prev) => [toast, ...prev].slice(0, 4));

      timers.current[id] = window.setTimeout(() => remove(id), durationMs);
    },
    [remove]
  );

  const api = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (message, title) => push({ kind: "success", message, title }),
      error: (message, title) => push({ kind: "error", message, title, durationMs: 3400 }),
      info: (message, title) => push({ kind: "info", message, title }),
      warning: (message, title) => push({ kind: "warning", message, title }),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Container */}
      <div className="fixed right-4 top-4 z-[9999] flex w-[92vw] max-w-[420px] flex-col gap-2 sm:w-[420px]">
        {toasts.map((t) => {
          const st = kindStyles(t.kind);
          return (
            <div
              key={t.id}
              className={`rounded-2xl border ${st.border} bg-white p-4 shadow-theme-sm dark:bg-gray-900`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-1 inline-flex h-2.5 w-2.5 rounded-full ${st.dot}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-semibold ${st.title}`}>
                        {t.title || (t.kind === "success"
                          ? "Listo"
                          : t.kind === "error"
                          ? "Ups"
                          : t.kind === "warning"
                          ? "Atención"
                          : "Info")}
                      </p>
                      <p className={`mt-0.5 text-sm ${st.msg}`}>{t.message}</p>
                    </div>

                    <button
                      onClick={() => remove(t.id)}
                      className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]"
                      aria-label="Cerrar"
                      type="button"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${st.badge}`}>
                      {t.kind.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider />");
  return ctx;
}
