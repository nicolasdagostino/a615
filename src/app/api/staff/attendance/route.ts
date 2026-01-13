import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** YYYY-MM-DD en Europe/Madrid */
function isoTodayMadrid() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

async function requireStaff(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data, error } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) return { ok: false as const, error: error.message };
  const role = String((data as any)?.role || "");
  if (role !== "admin" && role !== "coach") return { ok: false as const, error: "Forbidden" };
  return { ok: true as const, role };
}

/**
 * GET /api/staff/attendance?date=YYYY-MM-DD
 * Staff-only: sesiones del día + roster de reservados (activos) + status present/absent/null
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const date = String(url.searchParams.get("date") || "").trim() || isoTodayMadrid();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date. Use YYYY-MM-DD" }, { status: 400 });
    }

    const admin = createAdminClient();
    const staff = await requireStaff(admin, user.id);
    if (!staff.ok) return NextResponse.json({ error: staff.error }, { status: staff.error === "Forbidden" ? 403 : 400 });

    // 1) Sesiones del día (con clase)
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
      .eq("session_date", date)
      .order("start_time", { ascending: true });

    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 400 });

    const sessionIds = (sessions || []).map((s: any) => String(s.id));
    if (!sessionIds.length) return NextResponse.json({ ok: true, date, sessions: [] });

    // 2) Reservas activas por sesión
    const { data: resRows, error: rErr } = await admin
      .from("reservations")
      .select("session_id, user_id")
      .in("session_id", sessionIds)
      .is("cancelled_at", null);

    if (rErr) return NextResponse.json({ error: rErr.message }, { status: 400 });

    const userIds = Array.from(new Set((resRows || []).map((r: any) => String(r.user_id))));
    // 3) Perfiles de esos users
    let profiles: any[] = [];
    if (userIds.length) {
      const { data: pRows, error: pErr } = await admin
        .from("profiles")
        .select("id, full_name, email, role")
        .in("id", userIds);

      if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 });
      profiles = pRows || [];
    }

    const profileMap = new Map<string, any>();
    profiles.forEach((p) => profileMap.set(String(p.id), p));

    // 4) Attendance rows existentes
    const { data: attRows, error: aErr } = await admin
      .from("attendance")
      .select("session_id, user_id, status, marked_at, marked_by")
      .in("session_id", sessionIds);

    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 400 });

    const attMap = new Map<string, any>();
    (attRows || []).forEach((a: any) => {
      attMap.set(`${String(a.session_id)}::${String(a.user_id)}`, a);
    });

    // Index reservas por sesión
    const bySession = new Map<string, string[]>();
    (resRows || []).forEach((r: any) => {
      const sid = String(r.session_id);
      const uid = String(r.user_id);
      bySession.set(sid, [...(bySession.get(sid) || []), uid]);
    });

    const out = (sessions || []).map((s: any) => {
      const sid = String(s.id);
      const rosterIds = bySession.get(sid) || [];
      const roster = rosterIds.map((uid) => {
        const p = profileMap.get(uid) || {};
        const a = attMap.get(`${sid}::${uid}`) || null;
        const status = a ? (String(a.status).toLowerCase() === "present" ? "present" : "absent") : null;

        return {
          userId: uid,
          name: String(p.full_name || p.email || "Atleta"),
          email: p.email ? String(p.email) : null,
          attendanceStatus: status as "present" | "absent" | null,
        };
      });

      roster.sort((a, b) => a.name.localeCompare(b.name));

      return {
        id: sid,
        date: String(s.session_date),
        time: String(s.start_time).slice(0, 5),
        status: String(s.status || "scheduled"),
        notes: s.notes ?? null,
        class: {
          id: String(s.classes?.id || s.class_id),
          name: String(s.classes?.name || ""),
          coach: String(s.classes?.coach || ""),
          type: String(s.classes?.type || ""),
        },
        roster,
      };
    });

    return NextResponse.json({ ok: true, date, sessions: out });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/staff/attendance
 * body: { sessionId: string, userId: string, status: "present" | "absent" }
 * Staff-only: upsert attendance
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({} as any));
    const sessionId = String(body.sessionId || "").trim();
    const userId = String(body.userId || "").trim();
    const statusRaw = String(body.status || "").trim().toLowerCase();

    if (!sessionId || !userId) {
      return NextResponse.json({ error: "sessionId and userId are required" }, { status: 400 });
    }
    if (statusRaw !== "present" && statusRaw !== "absent") {
      return NextResponse.json({ error: "status must be present|absent" }, { status: 400 });
    }

    const admin = createAdminClient();
    const staff = await requireStaff(admin, user.id);
    if (!staff.ok) return NextResponse.json({ error: staff.error }, { status: staff.error === "Forbidden" ? 403 : 400 });

    // Upsert por unique(session_id, user_id)
    const { data, error } = await admin
      .from("attendance")
      .upsert(
        {
          session_id: sessionId,
          user_id: userId,
          status: statusRaw,
          marked_by: user.id,
          marked_at: new Date().toISOString(),
        },
        { onConflict: "session_id,user_id" }
      )
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, id: String((data as any)?.id || "") });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
