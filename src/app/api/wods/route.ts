import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/wods
 * Public endpoint (athlete) - devuelve SOLO publicados.
 * Soporta:
 *  - /api/wods?date=YYYY-MM-DD
 *  - /api/wods?month=YYYY-MM
 *  - + filtro por programId (program_id)
 *  - legacy: track (si existe en DB) para compat
 */

function normalizeDate(d: string) {
  const v = String(d || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  return v;
}

function normalizeMonth(m: string) {
  const v = String(m || "").trim();
  if (!/^\d{4}-\d{2}$/.test(v)) return null;
  return v;
}

function normalizeUuid(v: any) {
  const s = String(v || "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)) return null;
  return s;
}

// legacy track (si lo querés mantener)
function normalizeTrack(track: string) {
  const t = String(track || "").trim().toLowerCase();
  if (!t) return null;
  return t;
}

function toUi(row: any) {
  return {
    id: String(row.id),
    wodDate: String(row.wod_date || ""),
    programId: String(row.program_id || ""),
    programName: String((row as any)?.programs?.name || ""),
    // legacy:
    track: String(row.track || ""),
    workout: String(row.workout || ""),
    isPublished: !!row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(req: Request) {
  try {
    // atleta logueado (mantenemos tu regla de auth)
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const url = new URL(req.url);

    const dateParam = String(url.searchParams.get("date") || "").trim();
    const monthParam = String(url.searchParams.get("month") || "").trim();
    const programParam = String(url.searchParams.get("programId") || url.searchParams.get("program_id") || "").trim();

    // legacy track (por si alguna pantalla vieja lo usa)
    const trackParam = String(url.searchParams.get("track") || "").trim();

    let query = admin
      .from("wods")
      .select("id, wod_date, program_id, programs(name), track, workout, is_published, created_at, updated_at")
      .eq("is_published", true)
      .order("wod_date", { ascending: false });

    if (dateParam) {
      const d = normalizeDate(dateParam);
      if (!d) return NextResponse.json({ error: "Invalid date (YYYY-MM-DD)" }, { status: 400 });
      query = query.eq("wod_date", d);
    } else if (monthParam) {
      const m = normalizeMonth(monthParam);
      if (!m) return NextResponse.json({ error: "Invalid month (YYYY-MM)" }, { status: 400 });

      const start = `${m}-01`;
      const [y, mm] = m.split("-").map((x) => Number(x));
      const nextMonth = mm === 12 ? `${y + 1}-01` : `${y}-${String(mm + 1).padStart(2, "0")}`;
      const endExclusive = `${nextMonth}-01`;

      query = query.gte("wod_date", start).lt("wod_date", endExclusive);
    }

    if (programParam) {
      const pid = normalizeUuid(programParam);
      if (!pid) return NextResponse.json({ error: "Invalid programId" }, { status: 400 });
      query = query.eq("program_id", pid);
    } else if (trackParam) {
      const t = normalizeTrack(trackParam);
      if (!t) return NextResponse.json({ error: "Invalid track" }, { status: 400 });
      // legacy: por si querés seguir soportándolo
      query = query.eq("track", t);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, wods: (data || []).map(toUi) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
