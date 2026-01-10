"use client";

import { useEffect, useMemo, useState } from "react";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";

type ApiWod = {
  id: string;
  wodDate: string; // YYYY-MM-DD
  track: string;
  title?: string | null;
  workout: string;
  coachNotes?: string | null;
  isPublished?: boolean;
};

type ApiComment = {
  id: string;
  text: string;
  createdAt: string;
  authorName?: string | null;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function monthLabel(m: number) {
  const labels = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
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
  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1;

  const [searchText, setSearchText] = useState("");
  const [month, setMonth] = useState<number>(defaultMonth);
  const [year, setYear] = useState<number>(defaultYear);

  // Track selector (tu negocio: CrossFit / Functional / Weightlifting / Open Gym)
  const trackOptions = useMemo(
    () => [
      { value: "crossfit", label: "CrossFit" },
      { value: "functional", label: "Functional" },
      { value: "weightlifting", label: "Weightlifting" },
      { value: "open_gym", label: "Open Gym" },
    ],
    []
  );
  const [track, setTrack] = useState<string>("crossfit");

  const [wods, setWods] = useState<ApiWod[]>([]);
  const [selectedWodId, setSelectedWodId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [commentsByWodId, setCommentsByWodId] = useState<Record<string, ApiComment[]>>({});
  const [loadingComments, setLoadingComments] = useState(false);

  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  // 1) Load WODs (published) from API
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        // Traemos todos y filtramos en cliente por mes/año/busqueda
        // (si querés optimizar luego, hacemos ?year&month&track)
        const res = await fetch(`/api/wods?track=${encodeURIComponent(track)}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(String((data as any)?.error || "Failed to load wods"));
        if (!alive) return;

        const list: ApiWod[] = Array.isArray((data as any)?.wods) ? (data as any).wods : [];
        setWods(
          list.map((w) => ({
            id: String((w as any).id),
            wodDate: String((w as any).wodDate || (w as any).date || ""),
            track: String((w as any).track || ""),
            title: (w as any).title ?? null,
            workout: String((w as any).workout || (w as any).content || ""),
            coachNotes: (w as any).coachNotes ?? null,
            isPublished: Boolean((w as any).isPublished ?? true),
          }))
        );
      } catch (e) {
        console.error("Failed to load wods", e);
        setWods([]);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [track]);

  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: monthLabel(i + 1) })),
    []
  );

  const yearOptions = useMemo(() => {
    const y = defaultYear;
    return [y, y - 1, y - 2, y - 3, y - 4].map((yy) => ({ value: String(yy), label: String(yy) }));
  }, [defaultYear]);

  // 2) List for month
  const listForMonth = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    return wods
      .filter((w) => isSameMonth(w.wodDate, year, month))
      .filter((w) => !q || (w.workout || "").toLowerCase().includes(q) || (w.title || "").toLowerCase().includes(q))
      .sort((a, b) => (a.wodDate < b.wodDate ? 1 : -1))
      .map((w) => {
        const comments = commentsByWodId[w.id] || [];
        return {
          id: w.id,
          date: w.wodDate,
          preview: (w.workout || "").replace(/\n/g, " ").slice(0, 90) + ((w.workout || "").length > 90 ? "…" : ""),
          commentCount: comments.length,
        };
      });
  }, [wods, year, month, searchText, commentsByWodId]);

  const selectedWod = useMemo(() => {
    const id = selectedWodId ?? (listForMonth[0]?.id ?? null);
    if (!id) return null;
    return wods.find((w) => w.id === id) ?? null;
  }, [wods, selectedWodId, listForMonth]);

  // 3) Auto-select first item when list changes
  useEffect(() => {
    const first = listForMonth[0];
    if (!first) {
      setSelectedWodId(null);
      setSelectedDate(null);
      return;
    }
    setSelectedWodId((prev) => (prev && listForMonth.some((x) => x.id === prev) ? prev : first.id));
    setSelectedDate((prev) => (prev && listForMonth.some((x) => x.date === prev) ? prev : first.date));
  }, [listForMonth]);

  // 4) Load comments when selectedWod changes
  useEffect(() => {
    let alive = true;

    async function loadComments(wodId: string) {
      if (!wodId) return;
      // cache: si ya tenemos, no volvemos a pedir
      if (commentsByWodId[wodId]) return;

      setLoadingComments(true);
      try {
        const res = await fetch(`/api/wods/comments?wodId=${encodeURIComponent(wodId)}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(String((data as any)?.error || "Failed to load comments"));
        if (!alive) return;

        const list = Array.isArray((data as any)?.comments) ? (data as any).comments : [];
        const mapped: ApiComment[] = list.map((c: any) => ({
          id: String(c.id || `${wodId}-${Math.random()}`),
          text: String(c.text || c.body || c.message || ""),
          createdAt: String(c.createdAt || c.created_at || new Date().toISOString()),
          authorName: (c.authorName || c.author?.name || c.author || "—") as string,
        }));

        setCommentsByWodId((prev) => ({ ...prev, [wodId]: mapped }));
      } catch (e) {
        console.error("Failed to load comments", e);
        setCommentsByWodId((prev) => ({ ...prev, [wodId]: [] }));
      } finally {
        if (alive) setLoadingComments(false);
      }
    }

    if (selectedWod?.id) loadComments(selectedWod.id);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWod?.id]);

  const onSearchClick = () => {
    // no-op: ya filtra por useMemo
    // pero mantenemos el botón para UX
  };

  const addComment = async () => {
    if (!selectedWod?.id) return;
    const text = newComment.trim();
    if (!text) return;

    setPosting(true);
    try {
      const res = await fetch("/api/wods/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wodId: selectedWod.id, body: text }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String((data as any)?.error || "Failed to post comment"));

      // volvemos a pedir comments (o hacemos append optimista)
      // hacemos append optimista acá para UX:
      const createdAt = new Date().toISOString();
      const newItem: ApiComment = {
        id: String((data as any)?.id || `${selectedWod.id}-${Date.now()}`),
        text,
        createdAt,
        authorName: "Tú",
      };

      setCommentsByWodId((prev) => ({
        ...prev,
        [selectedWod.id]: [...(prev[selectedWod.id] || []), newItem],
      }));

      setNewComment("");
    } catch (e) {
      console.error(e);
    } finally {
      setPosting(false);
    }
  };

  const selectedComments = selectedWod?.id ? (commentsByWodId[selectedWod.id] || []) : [];

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
              options={trackOptions}
              placeholder="Track"
              onChange={(v) => setTrack(String(v))}
              defaultValue={track}
            />
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
                    WODs · {monthLabel(month)} {year} · {trackOptions.find(t => t.value === track)?.label ?? track}
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
                  No hay WODs publicados para este mes/track.
                </div>
              ) : (
                <div className="space-y-2">
                  {listForMonth.map((item) => {
                    const active = (selectedWodId ?? listForMonth[0]?.id) === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedWodId(item.id);
                          setSelectedDate(item.date);
                        }}
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
                {selectedWod && selectedDate ? `WOD · ${formatDateShort(selectedDate)}` : "WOD"}
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
                      {selectedWod.workout}
                    </pre>
                    {selectedWod.coachNotes ? (
                      <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-semibold">Notas:</span> {selectedWod.coachNotes}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">Comentarios</h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {loadingComments ? "…" : selectedComments.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {loadingComments ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400">Cargando comentarios…</div>
                      ) : selectedComments.length === 0 ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400">Todavía no hay comentarios.</div>
                      ) : (
                        selectedComments.map((c) => (
                          <div key={c.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                                {c.authorName || "—"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(c.createdAt).toLocaleString()}
                              </p>
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
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                          />

                        </div>
                        <Button variant="primary" onClick={addComment} disabled={posting}>
                          {posting ? "Publicando..." : "Publicar"}
                        </Button>
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Se guarda en base de datos (persistente).
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
