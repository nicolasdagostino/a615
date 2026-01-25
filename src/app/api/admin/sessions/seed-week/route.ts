import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ClassRow = {
  id: string;
  day: string; // mon..sun
  time: string; // HH:MM
  duration_min: number;
  capacity: number;
  status: string;
};

function toDayCode(d: Date): string {
  // JS: 0=Sun..6=Sat
  const n = d.getUTCDay();
  if (n === 0) return "sun";
  if (n === 1) return "mon";
  if (n === 2) return "tue";
  if (n === 3) return "wed";
  if (n === 4) return "thu";
  if (n === 5) return "fri";
  return "sat";
}

function addDays(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

async function assertAdmin() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (String((profile as any)?.role || "").toLowerCase() !== "admin") {
    return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const, userId: user.id };
}

/**
 * POST /api/admin/sessions/seed-week?start=YYYY-MM-DD
 * Crea/actualiza (upsert) sesiones para 7 días desde start.
 * SOLO toma clases activas (is_active=true).
 */
export async function POST(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const url = new URL(req.url);
    const start = String(url.searchParams.get("start") || "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) {
      return NextResponse.json({ error: "Missing/invalid start. Use ?start=YYYY-MM-DD" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: classes, error: cErr } = await admin
      .from("classes")
      .select("id, day, time, duration_min, capacity, status")
      .eq("is_active", true)
      .order("day", { ascending: true })
      .order("time", { ascending: true });

    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 });

    const rows = (classes || []) as any as ClassRow[];
    const inserts: any[] = [];

    for (let i = 0; i < 7; i++) {
      const dateISO = addDays(start, i);
      const d = new Date(`${dateISO}T00:00:00.000Z`);
      const dayCode = toDayCode(d);

      const forDay = rows.filter((c) => String(c.day || "").trim().toLowerCase() === dayCode);

      for (const c of forDay) {
        const t = String(c.time || "").trim();
        const startTime = t.length === 5 ? `${t}:00` : t;

        inserts.push({
          class_id: c.id,
          session_date: dateISO,
          start_time: startTime,
          duration_min: Number(c.duration_min ?? 60),
          capacity: Number(c.capacity ?? 12),
          status: String(c.status || "scheduled"),
        });
      }
    }

    if (inserts.length === 0) {
      return NextResponse.json({ ok: true, createdOrUpdated: 0, note: "No active classes found to seed." });
    }

    const { data: up, error: upErr } = await admin
      .from("class_sessions")
      .upsert(inserts, { onConflict: "class_id,session_date,start_time" })
      .select("id");

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

    return NextResponse.json({ ok: true, start, days: 7, createdOrUpdated: (up || []).length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
