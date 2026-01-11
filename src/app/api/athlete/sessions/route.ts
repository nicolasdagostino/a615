import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function isoTodayUTC() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/**
 * GET /api/athlete/sessions?date=YYYY-MM-DD&days=7
 * Response: sesiones con reservedCount + flag reservedByMe
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const baseDate = String(url.searchParams.get("date") || "").trim() || isoTodayUTC();
    const daysRaw = String(url.searchParams.get("days") || "7").trim();
    const days = Math.max(1, Math.min(31, Number(daysRaw) || 7));

    if (!/^\d{4}-\d{2}-\d{2}$/.test(baseDate)) {
      return NextResponse.json({ error: "Invalid date. Use YYYY-MM-DD" }, { status: 400 });
    }

    const dateTo = addDaysISO(baseDate, days); // exclusive

    const admin = createAdminClient();

    // 1) Traer sesiones + clase base
    const { data: sessions, error: sErr } = await admin
      .from("class_sessions")
      .select(`
        id,
        class_id,
        session_date,
        start_time,
        duration_min,
        capacity,
        status,
        notes,
        classes:classes (
          id, name, coach, type
        )
      `)
      .gte("session_date", baseDate)
      .lt("session_date", dateTo)
      .order("session_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 400 });

    const ids = (sessions || []).map((x: any) => x.id);

    // 2) Contar reservados por sesión (view)
    const { data: counts } = await admin
      .from("v_session_reserved_counts")
      .select("session_id, reserved_count")
      .in("session_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

    const countMap = new Map<string, number>();
    (counts || []).forEach((r: any) => countMap.set(String(r.session_id), Number(r.reserved_count || 0)));

    // 3) Mis reservas para marcar reservedByMe
    const { data: myRes } = await admin
      .from("reservations")
      .select("session_id")
      .eq("user_id", user.id)
      .is("cancelled_at", null)
      .in("session_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

    const mySet = new Set<string>((myRes || []).map((r: any) => String(r.session_id)));

    const out = (sessions || []).map((s: any) => {
      const reservedCount = countMap.get(String(s.id)) ?? 0;
      return {
        id: String(s.id),
        date: String(s.session_date),
        time: String(s.start_time).slice(0, 5), // HH:MM
        durationMin: Number(s.duration_min ?? 60),
        capacity: Number(s.capacity ?? 12),
        reservedCount,
        remaining: Math.max(0, Number(s.capacity ?? 0) - reservedCount),
        status: String(s.status || "scheduled"),
        notes: s.notes ?? null,
        class: {
          id: String(s.classes?.id || s.class_id),
          name: String(s.classes?.name || ""),
          coach: String(s.classes?.coach || ""),
          type: String(s.classes?.type || ""),
        },
        reservedByMe: mySet.has(String(s.id)),
      };
    });

    return NextResponse.json({ ok: true, date: baseDate, days, sessions: out });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
