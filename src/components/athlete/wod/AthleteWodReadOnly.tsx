"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/form/input/TextArea";

type Program = { id: string; name: string };

type Wod = {
  id: string;
  wodDate: string;
  programId: string;
  programName: string;
  workout: string;
  isPublished: boolean;
};

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author: string;
};

function isoToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

// intenta extraer programId + programName de formatos distintos (robusto)
function extractProgramsFromSessionsPayload(payload: any): Program[] {
  const arr =
    (Array.isArray(payload?.sessions) && payload.sessions) ||
    (Array.isArray(payload?.classes) && payload.classes) ||
    (Array.isArray(payload?.items) && payload.items) ||
    (Array.isArray(payload?.data) && payload.data) ||
    [];

  const out: Program[] = [];
  const seen = new Set<string>();

  for (const it of arr) {
    const pid = String(
      it?.programId ??
        it?.program_id ??
        it?.program?.id ??
        it?.class?.programId ??
        it?.class?.program_id ??
        it?.class?.program?.id ??
        it?.cls?.programId ??
        it?.cls?.program_id ??
        ""
    ).trim();

    if (!pid) continue;

    const name =
      String(
        it?.programName ??
          it?.program_name ??
          it?.program?.name ??
          it?.class?.programName ??
          it?.class?.program_name ??
          it?.class?.program?.name ??
          ""
      ).trim() || pid;

    if (seen.has(pid)) continue;
    seen.add(pid);
    out.push({ id: pid, name });
  }

  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

export default function AthleteWodReadOnly() {
  // ✅ filtramos por DIA
  const [date, setDate] = useState<string>(isoToday());

  const [programs, setPrograms] = useState<Program[]>([]);
  const [programId, setProgramId] = useState<string>("");

  const [wods, setWods] = useState<Wod[]>([]);
  const [loadingWods, setLoadingWods] = useState(false);

  const [activeWodId, setActiveWodId] = useState<string>("");
  const activeWod = useMemo(() => wods.find((w) => w.id === activeWodId) || null, [wods, activeWodId]);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);

  // 1) Cargar programas ACTIVOS para el día; si no hay, fallback a /api/programs
  useEffect(() => {
    let alive = true;

    async function loadActiveProgramsForDay() {
      try {
        // Intento A: sessions?date=
        let res = await fetch(`/api/athlete/sessions?date=${encodeURIComponent(date)}&days=1`, { method: "GET" });
        let data: any = await res.json().catch(() => ({}));

        // Intento B: today?date=
        if (!res.ok) {
          res = await fetch(`/api/athlete/today?date=${encodeURIComponent(date)}`, { method: "GET" });
          data = await res.json().catch(() => ({}));
        }

        // Intento C: today (sin date)
        if (!res.ok) {
          res = await fetch(`/api/athlete/today`, { method: "GET" });
          data = await res.json().catch(() => ({}));
        }

        let active = res.ok ? extractProgramsFromSessionsPayload(data) : [];

        // Fallback: todos los programs (cuando no hay clases ese día)
        if (active.length === 0) {
          const res2 = await fetch("/api/programs", { method: "GET" });
          const data2 = await res2.json().catch(() => ({}));
          if (res2.ok) {
            const list = Array.isArray(data2?.programs) ? data2.programs : [];
            active = list
              .map((p: any) => ({ id: String(p.id), name: String(p.name || "") }))
              .filter((p: any) => p.id && p.name)
              .sort((a: any, b: any) => a.name.localeCompare(b.name));
          }
        }

        if (!alive) return;
        setPrograms(active);

        const cur = String(programId || "").trim();
        if (!cur) {
          if (active.length > 0) setProgramId(active[0].id);
        } else {
          const exists = active.some((p) => p.id === cur);
          if (!exists && active.length > 0) setProgramId(active[0].id);
        }
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setPrograms([]);
        setProgramId("");
      }
    }

    loadActiveProgramsForDay();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // 2) Cargar WODs del DIA para el program seleccionado
  useEffect(() => {
    let alive = true;

    async function loadWods() {
      if (!programId) {
        setWods([]);
        setActiveWodId("");
        return;
      }

      setLoadingWods(true);
      try {
        const res = await fetch(
          `/api/wods?date=${encodeURIComponent(date)}&programId=${encodeURIComponent(programId)}`,
          { method: "GET" }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(String((data as any)?.error || "Failed to load wods"));

        const list = Array.isArray((data as any)?.wods) ? (data as any).wods : [];
        const mapped: Wod[] = list.map((w: any) => ({
          id: String(w.id),
          wodDate: String(w.wodDate || w.wod_date || ""),
          programId: String(w.programId || w.program_id || ""),
          programName: String(w.programName || w.program_name || ""),
          workout: String(w.workout || ""),
          isPublished: Boolean(w.isPublished ?? w.is_published),
        }));

        mapped.sort((a, b) => (a.wodDate < b.wodDate ? 1 : -1));

        if (!alive) return;
        setWods(mapped);
        setActiveWodId(mapped.length > 0 ? mapped[0].id : "");
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setWods([]);
        setActiveWodId("");
      } finally {
        if (alive) setLoadingWods(false);
      }
    }

    loadWods();
    return () => {
      alive = false;
    };
  }, [programId, date]);

  // 3) Cargar comentarios del WOD activo
  useEffect(() => {
    let alive = true;

    async function loadComments() {
      if (!activeWodId) {
        setComments([]);
        return;
      }

      setLoadingComments(true);
      try {
        const res = await fetch(`/api/wods/comments?wodId=${encodeURIComponent(activeWodId)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(String((data as any)?.error || "Failed to load comments"));

        const list = Array.isArray((data as any)?.comments) ? (data as any).comments : [];
        const mapped: Comment[] = list.map((c: any) => ({
          id: String(c.id),
          body: String(c.body ?? c.message ?? ""),
          createdAt: String(c.createdAt || c.created_at || ""),
          author: (typeof c.author === "string" ? c.author : (c.author?.name || c.author?.full_name || c.author?.email || "")) || String(c.author ?? c.userName ?? "User"),
        }));

        if (!alive) return;
        setComments(mapped);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setComments([]);
      } finally {
        if (alive) setLoadingComments(false);
      }
    }

    loadComments();
    return () => {
      alive = false;
    };
  }, [activeWodId]);

  const postComment = async () => {
    if (!activeWodId) return;
    const msg = message.trim();
    if (!msg) return;

    setPosting(true);
    try {
      const res = await fetch("/api/wods/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wodId: activeWodId, body: msg }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String((data as any)?.error || "Failed to post comment"));

      setMessage("");

      // reload comments (mismo mapeo)
      const res2 = await fetch(`/api/wods/comments?wodId=${encodeURIComponent(activeWodId)}`);
      const data2 = await res2.json().catch(() => ({}));
      const list = Array.isArray((data2 as any)?.comments) ? (data2 as any).comments : [];
      setComments(
        list.map((c: any) => ({
          id: String(c.id),
          body: String(c.body ?? c.message ?? ""),
          createdAt: String(c.createdAt || c.created_at || ""),
          author: (typeof c.author === "string" ? c.author : (c.author?.name || c.author?.full_name || c.author?.email || "")) || String(c.author ?? c.userName ?? "User"),
        }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">WOD del día</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Te mostramos automáticamente los WODs de los programas que tienen clases ese día.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 lg:w-[190px]"
            />

            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 lg:w-[260px]"
            >
              {programs.length === 0 ? (
                <option value="">No programs</option>
              ) : (
                programs.map((p) => (
                  <option key={p.id} value={p.id} className="text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Active WOD + Comments */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">WOD</h3>
              {activeWod ? (
                <div className="flex items-center gap-2">
                  <Badge color="success">
                    <span className="text-xs">{activeWod.programName || "Program"}</span>
                  </Badge>
                  <Badge color="success">
                    <span className="text-xs">{activeWod.wodDate}</span>
                  </Badge>
                </div>
              ) : null}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loadingWods ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Cargando WOD…</p>
            ) : activeWod ? (
              <div className="whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-gray-300">
                {activeWod.workout}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay WOD publicado para este programa y día.</p>
            )}
          </div>
        </div>

        {/* Comments */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Comentarios</h3>
          </div>

          <div className="space-y-4 p-4 sm:p-6">
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <TextArea
                rows={3}
                placeholder={activeWod ? "Escribe un comentario..." : "Seleccioná un WOD para comentar"}
                value={message}
                onChange={(value) => setMessage(String(value))}
              />
              <div className="mt-3 flex justify-end">
                <Button variant="primary" onClick={postComment} disabled={!activeWodId || posting}>
                  {posting ? "Publicando..." : "Publicar"}
                </Button>
              </div>
            </div>

            {loadingComments ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Cargando comentarios…</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Todavía no hay comentarios.</p>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                        {c.author || c.author || "User"}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{c.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
