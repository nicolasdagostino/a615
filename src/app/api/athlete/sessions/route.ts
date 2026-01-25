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
 *
 * IMPORTANTE:
 * - NO usa joins (schema cache) entre classes/coaches/programs.
 * - Resuelve programName y coachName por queries separadas (robusto).
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

    // Auto-seed SOLO para admin/coach (evita olvidos)
    const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const role = String((prof as any)?.role || "").toLowerCase();
    if (role === "admin" || role === "coach") {
      await ensureSessionsForRange(admin, baseDate, days);
    }

    // 1) Sessions (SOLO scheduled)
    const { data: sessionsRaw, error: sErr } = await admin
      .from("class_sessions")
      .select("id, class_id, session_date, start_time, duration_min, capacity, status, notes")
      .eq("status", "scheduled")
      .gte("session_date", baseDate)
      .lt("session_date", dateTo)
      .order("session_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 400 });

    const sessions = sessionsRaw || [];
    const sessionIds = sessions.map((x: any) => String(x.id));
    const classIds = Array.from(new Set(sessions.map((x: any) => String(x.class_id || "")).filter(Boolean)));

    // 2) Classes activas -> program_id + coach_id
    let classById: Record<string, { id: string; programId: string; coachId: string }> = {};
    if (classIds.length) {
      const { data: cls, error: cErr } = await admin
        .from("classes")
        .select("id, program_id, coach_id, is_active")
        .in("id", classIds);

      if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 });

      classById = Object.fromEntries(
        (cls || [])
          .filter((c: any) => Boolean(c.is_active ?? true))
          .map((c: any) => [
            String(c.id),
            {
              id: String(c.id),
              programId: String(c.program_id || ""),
              coachId: String(c.coach_id || ""),
            },
          ])
      );
    }

    // 2.5) Filtrar sesiones cuyo class quedó inactivo/no existe
    const filteredSessions = sessions.filter((s: any) => Boolean(classById[String(s.class_id || "")]));
    const filteredSessionIds = filteredSessions.map((x: any) => String(x.id));

    const programIds = Array.from(new Set(Object.values(classById).map((c) => c.programId).filter(Boolean)));
    const coachIds = Array.from(new Set(Object.values(classById).map((c) => c.coachId).filter(Boolean)));

    // 3) Programs -> name
    let programNameById: Record<string, string> = {};
    if (programIds.length) {
      const { data: progs, error: pErr } = await admin.from("programs").select("id, name").in("id", programIds);
      if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 });
      programNameById = Object.fromEntries(
        (progs || []).map((p: any) => [String(p.id), String(p.name || "Program").trim()])
      );
    }

    // 4) Coaches (profiles) -> full_name/email
    let coachNameById: Record<string, string> = {};
    if (coachIds.length) {
      const { data: profs, error: prErr } = await admin.from("profiles").select("id, full_name, email").in("id", coachIds);
      if (prErr) return NextResponse.json({ error: prErr.message }, { status: 400 });
      coachNameById = Object.fromEntries(
        (profs || []).map((p: any) => [String(p.id), String(p.full_name || p.email || "Coach").trim()])
      );
    }

    // 5) reservedCount por sesión (solo las filtradas)
    const { data: counts } = await admin
      .from("v_session_reserved_counts")
      .select("session_id, reserved_count")
      .in("session_id", filteredSessionIds.length ? filteredSessionIds : ["00000000-0000-0000-0000-000000000000"]);

    const countMap = new Map<string, number>();
    (counts || []).forEach((r: any) => countMap.set(String(r.session_id), Number(r.reserved_count || 0)));

    // 6) Mis reservas (activa o cancelada) (solo las filtradas)
    const { data: myRes, error: myErr } = await admin
      .from("reservations")
      .select("session_id, cancelled_at")
      .eq("user_id", user.id)
      .in("session_id", filteredSessionIds.length ? filteredSessionIds : ["00000000-0000-0000-0000-000000000000"]);

    if (myErr) return NextResponse.json({ error: myErr.message }, { status: 400 });

    const myMap = new Map<string, MyReservationStatus>();
    (myRes || []).forEach((r: any) => {
      const sid = String(r.session_id);
      myMap.set(sid, r.cancelled_at ? "cancelled" : "active");
    });

    // 7) Attendance del usuario (solo las filtradas)
    const { data: attRows, error: aErr } = await admin
      .from("attendance")
      .select("session_id, status")
      .eq("user_id", user.id)
      .in("session_id", filteredSessionIds.length ? filteredSessionIds : ["00000000-0000-0000-0000-000000000000"]);

    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 400 });

    const attMap = new Map<string, AttendanceStatus>();
    (attRows || []).forEach((a: any) => {
      const sid = String(a.session_id);
      const st = String(a.status || "").toLowerCase();
      attMap.set(sid, st === "present" ? "present" : st === "absent" ? "absent" : null);
    });

    // 8) Output
    const out = filteredSessions.map((s: any) => {
      const sid = String(s.id);
      const reservedCount = countMap.get(sid) ?? 0;
      const myReservationStatus = myMap.get(sid) ?? null;
      const attendanceStatus = attMap.get(sid) ?? null;

      const cls = classById[String(s.class_id)]!; // existe por el filtro
      const programId = String(cls.programId || "");
      const programName = String(programNameById[programId] || "").trim();
      const coachId = String(cls.coachId || "");
      const coachName = String(coachNameById[coachId] || "").trim();

      return {
        id: sid,
        date: String(s.session_date),
        time: String(s.start_time || "").slice(0, 5),
        durationMin: Number(s.duration_min ?? 60),
        capacity: Number(s.capacity ?? 12),
        reservedCount,
        remaining: Math.max(0, Number(s.capacity ?? 0) - reservedCount),
        status: String(s.status || "scheduled"),
        notes: s.notes ?? null,

        programId,
        programName: programName || "—",
        coachId,
        coachName: coachName || "—",

        class: {
          id: String(cls.id || s.class_id || ""),
          name: programName || "—",
          coach: coachName || "—",
          type: "",
          programId,
        },

        reservedByMe: myReservationStatus === "active",
        myReservationStatus,
        attendanceStatus,
      };
    });

    return NextResponse.json({ ok: true, date: baseDate, days, sessions: out });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}


// ---- Auto-seed helpers (admin/coach only) ----
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

type SeedClassRow = {
  id: string;
  day: string; // mon..sun
  time: string; // HH:MM
  duration_min: number;
  capacity: number;
  status: string;
};

async function ensureSessionsForRange(admin: any, startISO: string, days: number) {
  const { data: classes, error: cErr } = await admin
    .from("classes")
    .select("id, day, time, duration_min, capacity, status")
    .eq("is_active", true)
    .order("day", { ascending: true })
    .order("time", { ascending: true });


  if (cErr) throw new Error(cErr.message);

  const rows = (classes || []) as SeedClassRow[];
  if (!rows.length) return;

  const inserts: any[] = [];

  for (let i = 0; i < days; i++) {
    const dateISO = addDaysISO(startISO, i);
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
        duration_min: Number((c as any).duration_min ?? 60),
        capacity: Number((c as any).capacity ?? 12),
        status: String((c as any).status || "scheduled"),
      });
    }
  }

  if (!inserts.length) return;

  const { error: upErr } = await admin
    .from("class_sessions")
    .upsert(inserts, { onConflict: "class_id,session_date,start_time" });

  if (upErr) throw new Error(upErr.message);
}
