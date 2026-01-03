"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";function normalizeText(v: any) {
  return typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
}

function getRawLine(n: any) {
  return (
    normalizeText(n?.title) ||
    normalizeText(n?.message) ||
    normalizeText(n?.text) ||
    normalizeText(n?.body) ||
    normalizeText(n?.subtitle) ||
    ""
  );
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Fallback: intenta separar actor / action / target desde una línea de texto.
 * Ej: "Juan Pérez canceló su reserva en CrossFit 18:00"
 */
function parseActorActionTarget(line: string) {
  const s = normalizeText(line);
  if (!s) return { actor: "Notificación", action: "envió una notificación", target: "" };

  // Caso: "Actor: mensaje..."
  const colon = s.indexOf(":");
  if (colon > 0 && colon < 40) {
    const actor = s.slice(0, colon).trim();
    const rest = s.slice(colon + 1).trim();
    return { actor: actor || "Notificación", action: rest || "envió una notificación", target: "" };
  }

  // target por preposiciones comunes
  const targetMatch = s.match(/\b(en|sobre|a|para)\s+(.+)$/i);
  const target = targetMatch ? targetMatch[2].trim() : "";

  // actor: 2 palabras si empiezan con mayúscula (y 3ra si también parece nombre)
  const words = s.split(" ");
  let actor = "";
  if (words.length >= 2 && /^[A-ZÁÉÍÓÚÜÑ]/.test(words[0])) {
    actor = words.slice(0, 2).join(" ");
    if (words[2] && /^[A-ZÁÉÍÓÚÜÑ]/.test(words[2])) actor = words.slice(0, 3).join(" ");
  } else {
    actor = "Notificación";
  }

  let action = s;
  if (actor !== "Notificación" && s.startsWith(actor)) {
    action = s.slice(actor.length).trim();
  }

  // si hay target, lo quitamos del final de action para no duplicar
  if (target) {
    action = action
      .replace(new RegExp(`\\b(en|sobre|a|para)\\s+${escapeRegExp(target)}$`, "i"), "")
      .trim();
  }

  if (!action) action = "envió una notificación";
  return { actor, action, target };
}

function getType(n: any) {
  return n?.type ?? n?.kind ?? n?.event ?? n?.category ?? "general";
}

function getActor(n: any) {
  return (
    n?.actor?.name ??
    n?.actorName ??
    n?.user?.name ??
    n?.userName ??
    n?.name ??
    n?.author ??
    n?.from ??
    n?.gymName ??
    parseActorActionTarget(getRawLine(n)).actor
  );
}

function getAction(n: any) {
  // Si viene "action" explícita, mejor.
  const explicit =
    n?.action ??
    n?.verb ??
    n?.typeLabel ??
    "";

  if (explicit) return normalizeText(explicit);

  // Si no, parseamos desde el texto "raw"
  return parseActorActionTarget(getRawLine(n)).action;
}

function getTarget(n: any) {
  const explicit =
    n?.target ??
    n?.object ??
    n?.className ??
    n?.wodTitle ??
    n?.topic ??
    "";

  if (explicit) return normalizeText(explicit);

  return parseActorActionTarget(getRawLine(n)).target;
}

function getScopeFromPath(pathname: string) {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/coach")) return "coach";
  if (pathname.startsWith("/athlete")) return "athlete";
  return "admin";
}

function formatShortDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

function safeDate(n: any) {
  const raw = n?.date ?? n?.createdAt ?? n?.at ?? n?.time ?? n?.timestamp;
  const d = raw ? new Date(raw) : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
}

export default function NotificationDropdown() {
  const pathname = usePathname();
  const scope = getScopeFromPath(pathname);
  const viewAllHref = `/${scope}/community`;

  const [isOpen, setIsOpen] = useState(false);

  const items = useMemo(() => [], [scope]);

  function toggleDropdown() {
    setIsOpen((v) => !v);
  }
  function closeDropdown() {
    setIsOpen(false);
  }

  const badgeCount = Math.min(items.length, 8);

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="relative dropdown-toggle flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        aria-label="Notifications"
        type="button"
      >
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10 18.3333C11.1506 18.3333 12.0833 17.4006 12.0833 16.25H7.91667C7.91667 17.4006 8.84941 18.3333 10 18.3333ZM15.8333 14.1667V9.58333C15.8333 6.939 14.0883 4.7125 11.6667 3.9625V3.33333C11.6667 2.41286 10.9205 1.66667 10 1.66667C9.07953 1.66667 8.33333 2.41286 8.33333 3.33333V3.9625C5.91167 4.7125 4.16667 6.939 4.16667 9.58333V14.1667L2.5 15.8333V16.6667H17.5V15.8333L15.8333 14.1667Z"
            fill=""
          />
        </svg>

        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500 px-1 text-xs font-semibold text-white">
            {badgeCount}
          </span>
        )}
      </button>

      <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Notificaciones
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Últimas 8</p>
          </div>

          <Link
            href={viewAllHref}
            className="text-xs font-medium text-brand-500 hover:text-brand-600"
            onClick={closeDropdown}
          >
            Ver todas
          </Link>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
              No hay notificaciones.
            </div>
          ) : (
            items.map((n: any) => {
              const d = safeDate(n);
              const actor = getActor(n);
              const action = getAction(n);
              const target = getTarget(n);
              const subtitle = normalizeText(n?.description ?? n?.body ?? n?.subtitle ?? "");

              return (
                <DropdownItem
                  key={n?.id ?? `${getRawLine(n)}-${d.getTime()}`}
                  onItemClick={closeDropdown}
                  className="flex w-full gap-3 border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2Zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <span className="block min-w-0">
                        <span className="mb-1.5 block space-x-1 text-theme-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium text-gray-800 dark:text-white/90">
                            {actor}
                          </span>
                          <span>{action}</span>
                          {target ? (
                            <span className="font-medium text-gray-800 dark:text-white/90">
                              {target}
                            </span>
                          ) : null}
                        </span>
                      </span>

                      <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                        {formatShortDate(d)}
                      </span>
                    </div>

                    {subtitle ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                        {subtitle}
                      </p>
                    ) : null}
                  </div>
                </DropdownItem>
              );
            })
          )}
        </div>
      </Dropdown>
    </div>
  );
}
