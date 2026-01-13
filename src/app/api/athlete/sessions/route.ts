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

type MyReservationStatus = "active" | "cancelled" | null;
type AttendanceStatus = "present" | "absent" | null;

/**
 * GET /api/athlete/sessions?date=YYYY-MM-DD&days=7
 * Response: sesiones con reservedCount + reservedByMe + myReservationStatus + attendanceStatus
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

    // 1) Sesiones + clase base
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

    const ids = (sessions || []).map((x: any) => String(x.id));

    // 2) reservedCount por sesión
    const { data: counts } = await admin
      .from("v_session_reserved_counts")
      .select("session_id, reserved_count")
      .in("session_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

    const countMap = new Map<string, number>();
    (counts || []).forEach((r: any) =>
      countMap.set(String(r.session_id), Number(r.reserved_count || 0))
    );

    // 3) Mis reservas (activa o cancelada) para setear flags y permitir historial
    const { data: myRes, error: myErr } = await admin
      .from("reservations")
      .select("session_id, cancelled_at")
      .eq("user_id", user.id)
      .in("session_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

    if (myErr) return NextResponse.json({ error: myErr.message }, { status: 400 });

    const myMap = new Map<string, MyReservationStatus>();
    (myRes || []).forEach((r: any) => {
      const sid = String(r.session_id);
      myMap.set(sid, r.cancelled_at ? "cancelled" : "active");
    });

    // 4) Attendance del usuario para esas sesiones (si existe)
    const { data: attRows, error: aErr } = await admin
      .from("attendance")
      .select("session_id, status")
      .eq("user_id", user.id)
      .in("session_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 400 });

    const attMap = new Map<string, AttendanceStatus>();
    (attRows || []).forEach((a: any) => {
      const sid = String(a.session_id);
      const st = String(a.status || "").toLowerCase();
      attMap.set(sid, st === "present" ? "present" : st === "absent" ? "absent" : null);
    });

    const out = (sessions || []).map((s: any) => {
      const sid = String(s.id);
      const reservedCount = countMap.get(sid) ?? 0;
      const myReservationStatus = myMap.get(sid) ?? null;
      const attendanceStatus = attMap.get(sid) ?? null;

      return {
        id: sid,
        date: String(s.session_date),
        time: String(s.start_time).slice(0, 5),
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
        reservedByMe: myReservationStatus === "active",
        myReservationStatus,        // "active" | "cancelled" | null
        attendanceStatus,           // "present" | "absent" | null
      };
    });

    return NextResponse.json({ ok: true, date: baseDate, days, sessions: out });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
