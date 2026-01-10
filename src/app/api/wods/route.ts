import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function monthRange(year: number, month1to12: number) {
  const start = `${year}-${pad2(month1to12)}-01`;
  const endDate = new Date(year, month1to12, 0); // último día del mes
  const end = `${year}-${pad2(month1to12)}-${pad2(endDate.getDate())}`;
  return { start, end };
}

/**
 * GET /api/wods
 *
 * Modos:
 * 1) Detalle por día:
 *    /api/wods?date=YYYY-MM-DD&track=functional
 *
 * 2) Lista (feed) por track:
 *    /api/wods?track=functional
 *    opcional: &year=2026&month=1  (filtra por rango de mes)
 *
 * Devuelve:
 *  { ok: true, wods: [{ id, wodDate, track, title, workout, coachNotes, isPublished }] }
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const url = new URL(req.url);

    const date = String(url.searchParams.get("date") || "").trim(); // YYYY-MM-DD
    const trackRaw = String(url.searchParams.get("track") || "").trim();
    const track = trackRaw ? trackRaw.toLowerCase() : "";

    const yearRaw = String(url.searchParams.get("year") || "").trim();
    const monthRaw = String(url.searchParams.get("month") || "").trim();
    const year = yearRaw ? Number(yearRaw) : null;
    const month = monthRaw ? Number(monthRaw) : null;

    // Base query: solo publicados (tu requerimiento clave de feed)
    let q = supabase
      .from("wods")
      .select("id, wod_date, track, title, workout, coach_notes, is_published, type")
      .eq("is_published", true);

    if (track) q = q.eq("track", track);

    // MODO 1: detalle por día
    if (date) {
      const { data, error } = await q.eq("wod_date", date).limit(1);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      const rows = (data || []).map((w: any) => ({
        id: String(w.id),
        wodDate: String(w.wod_date),
        track: String(w.track),
        title: w.title ?? null,
        workout: String(w.workout || ""),
        coachNotes: w.coach_notes ?? null,
        isPublished: Boolean(w.is_published),
      }));

      return NextResponse.json({ ok: true, wods: rows });
    }

    // MODO 2: lista
    if (year && month && !Number.isNaN(year) && !Number.isNaN(month) && month >= 1 && month <= 12) {
      const { start, end } = monthRange(year, month);
      q = q.gte("wod_date", start).lte("wod_date", end);
    }

    const { data, error } = await q.order("wod_date", { ascending: false }).limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const rows = (data || []).map((w: any) => ({
      id: String(w.id),
      wodDate: String(w.wod_date),
      track: String(w.track),
      title: w.title ?? null,
      workout: String(w.workout || ""),
      coachNotes: w.coach_notes ?? null,
      isPublished: Boolean(w.is_published),
    }));

    return NextResponse.json({ ok: true, wods: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
