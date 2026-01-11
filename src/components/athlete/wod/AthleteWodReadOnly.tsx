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
        { value: "open-box", label: "Open Box" },
        { value: "weightlifting", label: "Weightlifting" },
        { value: "gymnastics", label: "Gymnastics" },
        { value: "kids", label: "Kids" },
        // legacy (si aún los usas)
        { value: "functional", label: "Functional" },
        { value: "open_gym", label: "Open Gym" },
    ],
    []
  );
  const [track, setTrack] = useState<string>("crossfit");

    // Sync state from URL query params (no next/navigation hooks)
    useEffect(() => {
      if (typeof window === "undefined") return;

      const applyFromUrl = () => {
        const sp = new URLSearchParams(window.location.search);
        const t = (sp.get("track") || "").trim().toLowerCase();
        const yRaw = (sp.get("year") || "").trim();
        const mRaw = (sp.get("month") || "").trim();
        const d = (sp.get("date") || "").trim();
        const q = (sp.get("q") || "").trim();
        if (q !== undefined) setSearchText(q);


        if (t) setTrack(t);

        // date=YYYY-MM-DD has priority and sets month/year
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
          const yy = Number(d.slice(0, 4));
          const mm = Number(d.slice(5, 7));
          if (!Number.isNaN(yy)) setYear(yy);
          if (!Number.isNaN(mm) && mm >= 1 && mm <= 12) setMonth(mm);
          setSelectedDate(d);
          return;
        }

        const yy = yRaw ? Number(yRaw) : null;
        const mm = mRaw ? Number(mRaw) : null;
        if (yy && !Number.isNaN(yy)) setYear(yy);
        if (mm && !Number.isNaN(mm) && mm >= 1 && mm <= 12) setMonth(mm);
      };

      applyFromUrl();
      window.addEventListener("popstate", applyFromUrl);
      return () => window.removeEventListener("popstate", applyFromUrl);
    }, []);

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
        const res = await fetch(`/api/wods?track=${encodeURIComponent(track)}&year=${encodeURIComponent(String(year))}&month=${encodeURIComponent(String(month))}`);
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
  }, [track, year, month]);
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

  // Si todavía no hay items, NO borres selectedDate (puede venir de la URL)
  if (!first) {
    setSelectedWodId(null);
    return;
  }

  // Si hay selectedDate (por URL o por click), tratamos de respetarlo
  if (selectedDate) {
    const hit = listForMonth.find((x) => x.date === selectedDate);
    if (hit) {
      setSelectedWodId(hit.id);
      return;
    }
  }

  // Fallback: elegimos el primero del mes
  setSelectedWodId((prev) =>
    prev && listForMonth.some((x) => x.id === prev) ? prev : first.id
  );
  setSelectedDate((prev) =>
    prev && listForMonth.some((x) => x.date === prev) ? prev : first.date
  );
}, [listForMonth, selectedDate]);


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
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <div>
              <select
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-theme-xs outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-transparent dark:text-white/90"
                value={track}
                onChange={(e) => setTrack(String(e.target.value))}
              >
                {trackOptions.map((o) => (
                  <option key={String(o.value)} value={String(o.value)}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <Select
                key={`month-${year}-${month}-${selectedDate || ""}`}
              options={monthOptions}
              placeholder="Month"
              onChange={(v) => setMonth(Number(v))}
              value={String(month)}
            />
            <div>
              <select
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 shadow-theme-xs outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-transparent dark:text-white/90"
                value={String(year)}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {yearOptions.map((o) => (
                  <option key={String(o.value)} value={String(o.value)}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* live filters: no search button */}
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
