"use client";

import { useMemo, useState } from "react";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";

type Comment = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
};

type Wod = {
  date: string; // YYYY-MM-DD
  content: string;
  comments: Comment[];
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function monthLabel(m: number) {
  const labels = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
  ];
  return labels[m - 1] ?? String(m);
}

function formatDateShort(iso: string) {
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  return `${pad2(d)}/${pad2(m)}/${y}`;
}

function isSameMonth(iso: string, year: number, month: number) {
  return iso.startsWith(`${year}-${pad2(month)}-`);
}

export default function AthleteWodReadOnly() {
  const [wods, setWods] = useState<Wod[]>([
    {
      date: "2026-01-01",
      content:
        "For time:\n21-15-9\nThrusters (42.5/30)\nPull-ups\n\nCap: 12'\n\nScaling: Thrusters 30/20 + Ring rows",
      comments: [
        { id: "c1", author: "Nico", text: "Me mató el 21 😅", createdAt: "01/01/2026 19:12" },
        { id: "c2", author: "Meli", text: "Hoy salieron mariposas jaja", createdAt: "01/01/2026 20:01" },
      ],
    },
    {
      date: "2026-01-02",
      content:
        "EMOM 20:\n1) 12/10 Cal Bike\n2) 12 KB Swings\n3) 10 Burpees\n4) Rest\n\nNotas: mantener ritmo sostenible",
      comments: [{ id: "c3", author: "Fede", text: "Muy buen sweat 😮‍💨", createdAt: "02/01/2026 10:40" }],
    },
    {
      date: "2026-01-03",
      content:
        "Strength:\nBack Squat 5x5 (build)\n\nMetcon:\nAMRAP 10\n10 Box Jumps\n10 Sit-ups\n200m Run",
      comments: [],
    },
    {
      date: "2025-12-29",
      content:
        "For quality:\n3 Rounds\n400m Run\n20 Lunges\n15 Push-ups\n\nCool down: 5-8' easy",
      comments: [{ id: "c4", author: "Ana", text: "Buenísimo para arrancar la semana", createdAt: "29/12/2025 08:22" }],
    },
  ]);

  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1;

  const [searchText, setSearchText] = useState("");
  const [month, setMonth] = useState<number>(defaultMonth);
  const [year, setYear] = useState<number>(defaultYear);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [newComment, setNewComment] = useState("");

  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: monthLabel(i + 1) })),
    []
  );

  const yearOptions = useMemo(() => {
    const y = defaultYear;
    return [y, y - 1, y - 2, y - 3, y - 4].map((yy) => ({ value: String(yy), label: String(yy) }));
  }, [defaultYear]);

  const listForMonth = useMemo(() => {
    return wods
      .filter((w) => isSameMonth(w.date, year, month))
      .filter((w) => !searchText.trim() || w.content.toLowerCase().includes(searchText.trim().toLowerCase()))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((w) => ({
        date: w.date,
        preview: w.content.replace(/\n/g, " ").slice(0, 90) + (w.content.length > 90 ? "…" : ""),
        commentCount: w.comments.length,
      }));
  }, [wods, year, month, searchText]);

  const selectedWod = useMemo(() => {
    const date = selectedDate ?? listForMonth[0]?.date ?? null;
    if (!date) return null;
    return wods.find((w) => w.date === date) ?? null;
  }, [wods, selectedDate, listForMonth]);

  const onSearchClick = () => {
    const first = listForMonth[0]?.date ?? null;
    if (!first) setSelectedDate(null);
    else setSelectedDate((prev) => (prev && listForMonth.some((x) => x.date === prev) ? prev : first));
  };

  const addComment = () => {
    if (!selectedWod) return;
    const text = newComment.trim();
    if (!text) return;

    const createdAt = new Date();
    const created =
      `${pad2(createdAt.getDate())}/${pad2(createdAt.getMonth() + 1)}/${createdAt.getFullYear()} ` +
      `${pad2(createdAt.getHours())}:${pad2(createdAt.getMinutes())}`;

    setWods((prev) =>
      prev.map((w) =>
        w.date !== selectedWod.date
          ? w
          : { ...w, comments: [...w.comments, { id: `${w.date}-${Date.now()}`, author: "Tú", text, createdAt: created }] }
      )
    );
    setNewComment("");
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="Search or type command..."
              defaultValue={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <Select
              options={monthOptions}
              placeholder="Month"
              onChange={(v) => setMonth(Number(v))}
              defaultValue={String(month)}
            />
            <Select
              options={yearOptions}
              placeholder="Year"
              onChange={(v) => setYear(Number(v))}
              defaultValue={String(year)}
            />
          </div>

          <div className="sm:ml-auto">
            <Button variant="primary" onClick={onSearchClick}>
              Buscar
              <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                  fill="currentColor"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    WODs · {monthLabel(month)} {year}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Seleccioná un WOD para ver detalle y comentarios.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {listForMonth.length} días
                </span>
              </div>
            </div>

            <div className="p-3 sm:p-4">
              {listForMonth.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  No hay WODs para este mes (mock).
                </div>
              ) : (
                <div className="space-y-2">
                  {listForMonth.map((item) => {
                    const active = (selectedDate ?? listForMonth[0]?.date) === item.date;
                    return (
                      <button
                        key={item.date}
                        type="button"
                        onClick={() => setSelectedDate(item.date)}
                        className={[
                          "w-full rounded-xl border px-4 py-3 text-left transition",
                          active
                            ? "border-brand-300 bg-brand-500/5 dark:border-brand-800"
                            : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                              {formatDateShort(item.date)}
                            </p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {item.preview}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            <svg width="16" height="16" viewBox="0 0 20 20" className="fill-current">
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M4.166 3.333C3.245 3.333 2.5 4.078 2.5 4.999V12.499C2.5 13.42 3.245 14.165 4.166 14.165H5.833V16.454C5.833 16.764 6.192 16.934 6.43 16.734L9.934 14.165H15.833C16.754 14.165 17.499 13.42 17.499 12.499V4.999C17.499 4.078 16.754 3.333 15.833 3.333H4.166Z"
                                fill="currentColor"
                              />
                            </svg>
                            <span>{item.commentCount}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-7">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {selectedWod ? `WOD · ${formatDateShort(selectedWod.date)}` : "WOD"}
              </h3>
            </div>

            <div className="p-4 sm:p-6">
              {!selectedWod ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  Seleccioná un día para ver el WOD.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                    <pre className="whitespace-pre-wrap text-sm leading-6 text-gray-800 dark:text-white/90 font-medium">
                      {selectedWod.content}
                    </pre>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">Comentarios</h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{selectedWod.comments.length}</span>
                    </div>

                    <div className="space-y-3">
                      {selectedWod.comments.length === 0 ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400">Todavía no hay comentarios.</div>
                      ) : (
                        selectedWod.comments.map((c) => (
                          <div key={c.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{c.author}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{c.createdAt}</p>
                            </div>
                            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{c.text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                      <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">Escribir comentario</p>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex-1">
                          <Input
                            placeholder="Escribí tu comentario..."
                            defaultValue={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                          />
                        </div>
                        <Button variant="primary" onClick={addComment}>Publicar</Button>
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        (Mock) Se agrega en memoria; al refrescar vuelve al seed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
