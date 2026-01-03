"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/form/input/TextArea";
import Badge from "@/components/ui/badge/Badge";
import { useWod } from "./wodStore";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function daysInMonth(year: number, month1to12: number) {
  return new Date(year, month1to12, 0).getDate();
}

function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  return { y, m, d };
}

function buildISODate(y: number, m: number, d: number) {
  const maxD = daysInMonth(y, m);
  const safeD = Math.min(Math.max(d, 1), maxD);
  return `${y}-${pad2(m)}-${pad2(safeD)}`;
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function WodPost() {
  const {
    selectedDate,
    setSelectedDate,
    getWodByDate,
    getCommentsByDate,
    addComment,
  } = useWod();

  const [message, setMessage] = useState("");

  // search UI
  const [q, setQ] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  const { y, m, d } = useMemo(() => parseISODate(selectedDate), [selectedDate]);
  const [month, setMonth] = useState<number>(m);
  const [year, setYear] = useState<number>(y);

  const wod = getWodByDate(selectedDate);
  const comments = getCommentsByDate(selectedDate);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => now - i);
  }, []);

  const months = useMemo(
    () => [
      { value: 1, label: "January" },
      { value: 2, label: "February" },
      { value: 3, label: "March" },
      { value: 4, label: "April" },
      { value: 5, label: "May" },
      { value: 6, label: "June" },
      { value: 7, label: "July" },
      { value: 8, label: "August" },
      { value: 9, label: "September" },
      { value: 10, label: "October" },
      { value: 11, label: "November" },
      { value: 12, label: "December" },
    ],
    []
  );

  const applyFilters = () => {
    // month/year update selectedDate (keeps day but clamps)
    const next = buildISODate(year, month, d);
    setSelectedDate(next);
    setActiveQuery(q.trim());
  };

  const renderedWod = useMemo(() => {
    if (!wod?.content) return null;
    if (!activeQuery) {
      return (
        <div className="text-sm leading-6 text-gray-700 dark:text-gray-300 whitespace-pre-line">
          {wod.content}
        </div>
      );
    }

    const re = new RegExp(`(${escapeRegExp(activeQuery)})`, "gi");
    const parts = wod.content.split(re);

    return (
      <div className="text-sm leading-6 text-gray-700 dark:text-gray-300 whitespace-pre-line">
        {parts.map((part, idx) => {
          const isHit = part.toLowerCase() === activeQuery.toLowerCase();
          return isHit ? (
            <mark
              key={idx}
              className="rounded bg-brand-50 px-1 text-gray-800 dark:bg-brand-500/15 dark:text-white/90"
            >
              {part}
            </mark>
          ) : (
            <span key={idx}>{part}</span>
          );
        })}
      </div>
    );
  }, [wod?.content, activeQuery]);

  return (
    <div className="space-y-6">
      {/* WOD post */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                WOD
              </h2>
              <Badge color="success">
                <span className="text-xs">{selectedDate}</span>
              </Badge>
            </div>
          </div>

          {/* Search + Month + Year + Button (one line on desktop) */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search input with lupa (AppHeader style) */}
            <div className="relative w-full lg:flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
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
                    d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                    fill=""
                  />
                </svg>
              </span>

              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search or type command..."
                className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              />
            </div>

            {/* Month select (DefaultInputs style) */}
            <div className="relative w-full lg:w-[180px]">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent py-2.5 pl-4 pr-10 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              >
                {months.map((mm) => (
                  <option
                    key={mm.value}
                    value={mm.value}
                    className="text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                  >
                    {mm.label}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                <svg
                  className="stroke-current"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                    stroke=""
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>

            {/* Year select */}
            <div className="relative w-full lg:w-[140px]">
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent py-2.5 pl-4 pr-10 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              >
                {years.map((yy) => (
                  <option
                    key={yy}
                    value={yy}
                    className="text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                  >
                    {yy}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                <svg
                  className="stroke-current"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                    stroke=""
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>

            {/* Search button (brand) */}
            <button
              type="button"
              onClick={applyFilters}
              className="bg-brand-500 shadow-sm inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-white transition hover:bg-brand-600 lg:w-auto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                  fill="currentColor"
                />
              </svg>
              Buscar
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {wod ? (
            renderedWod
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No hay WOD cargado para este día.
            </p>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white">
            Comentarios
          </h3>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          {/* Add comment */}
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <TextArea
              rows={3}
              placeholder="Escribe un comentario..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="mt-3 flex justify-end">
              <Button
                variant="primary"
                onClick={() => {
                  addComment(selectedDate, message);
                  setMessage("");
                }}
              >
                Publicar
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Todavía no hay comentarios.
              </p>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      {c.author.name}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    {c.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
