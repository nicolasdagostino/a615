import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function firstDayOfMonth(yy: number, mm: number) {
  return `${yy}-${pad2(mm)}-01`;
}
function firstDayNextMonth(yy: number, mm: number) {
  const d = new Date(Date.UTC(yy, mm - 1, 1));
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().slice(0, 10);
}
function isoTodayUTC() {
  return new Date().toISOString().slice(0, 10);
}

type TimeCol = "time" | "start_time" | "session_time" | "starts_at";

async function fetchSessionsWithTimeColumn(admin: any, start: string, end: string, todayISO: string) {
  const candidates: TimeCol[] = ["time", "start_time", "session_time", "starts_at"];

  let lastErr: any = null;

  for (const col of candidates) {
    const sel =
      col === "starts_at"
        ? "id, class_id, session_date, starts_at, duration_min, capacity, status, notes"
        : `id, class_id, session_date, ${col}, duration_min, capacity, status, notes`;

    const q = admin
      .from("class_sessions")
      .select(sel)
      .gte("session_date", start)
      .lt("session_date", end)
      .lte("session_date", todayISO);

    // order: por fecha y por hora (si existe)
    let ordered = q.order("session_date", { ascending: true });
    // starts_at es timestamp, el resto suele ser HH:MM text
    ordered = ordered.order(col, { ascending: true });

    const { data, error } = await ordered;

    if (!error) {
      return { rows: Array.isArray(data) ? data : [], timeCol: col };
    }

    // si el error es "column ... does not exist", probamos otro
    const msg = String(error?.message || "");
    if (msg.toLowerCase().includes("does not exist") && msg.toLowerCase().includes(`class_sessions.${col}`)) {
      lastErr = error;
      continue;
    }

    // otro error real (RLS, permisos, etc)
    return { rows: null, timeCol: col, fatal: error };
  }

  return { rows: null, timeCol: "time" as TimeCol, fatal: lastErr || new Error("No time column found") };
}

/**
 * GET /api/athlete/history?month=YYYY-MM
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const month = String(url.searchParams.get("month") || "").trim();
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "month must be YYYY-MM" }, { status: 400 });
    }

    const yy = Number(month.slice(0, 4));
    const mm = Number(month.slice(5, 7));
    const start = firstDayOfMonth(yy, mm);
    const end = firstDayNextMonth(yy, mm);
    const todayISO = isoTodayUTC();

    const admin = createAdminClient();

    const got = await fetchSessionsWithTimeColumn(admin, start, end, todayISO);
    if ((got as any).fatal) {
      return NextResponse.json({ error: String((got as any).fatal?.message || "Failed to load sessions") }, { status: 400 });
    }

    const sessions = got.rows || [];
    const timeCol = got.timeCol;

    if (sessions.length === 0) return NextResponse.json({ ok: true, sessions: [] });

    const classIds = Array.from(new Set(sessions.map((x: any) => String(x.class_id || "")).filter(Boolean)));

    const { data: classes, error: cErr } = await admin
      .from("classes")
      .select("id, program_id, coach_id")
      .in("id", classIds);

    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 });

    const byClassId = new Map<string, any>();
    for (const c of (classes || []) as any[]) byClassId.set(String(c.id), c);

    const programIds = Array.from(new Set((classes || []).map((c: any) => String(c.program_id || "")).filter(Boolean)));
    const coachIds = Array.from(new Set((classes || []).map((c: any) => String(c.coach_id || "")).filter(Boolean)));

    const programNameById: Record<string, string> = {};
    if (programIds.length) {
      const { data: progs, error: pErr } = await admin.from("programs").select("id, name").in("id", programIds);
      if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 });
      for (const p of (progs || []) as any[]) programNameById[String(p.id)] = String(p.name || "").trim();
    }

    const coachNameById: Record<string, string> = {};
    if (coachIds.length) {
      const { data: profs, error: prErr } = await admin.from("profiles").select("id, full_name, email").in("id", coachIds);
      if (prErr) return NextResponse.json({ error: prErr.message }, { status: 400 });
      for (const p of (profs || []) as any[]) coachNameById[String(p.id)] = String(p.full_name || p.email || "").trim();
    }

    // Attendance: best-effort (si no existe, queda null)
    const attendanceBySessionId = new Map<string, "present" | "absent" | null>();
    try {
      const sessionIds = sessions.map((x: any) => String(x.id));
      const { data: atts, error: attErr } = await admin
        .from("attendance")
        .select("session_id, status, user_id")
        .in("session_id", sessionIds)
        .eq("user_id", user.id);

      if (attErr) throw attErr;

      for (const a of (atts || []) as any[]) {
        const sid = String(a.session_id || "");
        const st = String(a.status || "").toLowerCase();
        if (st === "present") attendanceBySessionId.set(sid, "present");
        else if (st === "absent") attendanceBySessionId.set(sid, "absent");
        else attendanceBySessionId.set(sid, null);
      }
    } catch (e) {
      // No queremos romper el history por esto, pero sí ver el error en server logs.
      console.warn("[athlete/history] attendance lookup failed:", (e as any)?.message || e);
    }
const normalizeTime = (s: any) => {
      if (timeCol === "starts_at") {
        // timestamp -> HH:MM (UTC) (si querés Madrid, lo ajustamos después)
        const iso = String(s.starts_at || "");
        if (!iso) return "";
        const d = new Date(iso);
        const hh = String(d.getUTCHours()).padStart(2, "0");
        const mm = String(d.getUTCMinutes()).padStart(2, "0");
        return `${hh}:${mm}`;
      }
      return String(s[timeCol] || "");
    };

    const out = sessions.map((s: any) => {
      const classId = String(s.class_id || "");
      const c = byClassId.get(classId);
      const programId = String(c?.program_id || "");
      const coachId = String(c?.coach_id || "");

      const programName = programNameById[programId] || "Class";
      const coachName = coachNameById[coachId] || "—";

      return {
        id: String((s as any).session_id ?? (s as any).id ?? s.id),
        date: String(s.session_date),
        time: normalizeTime(s),
        durationMin: Number(s.duration_min ?? 0),
        capacity: Number(s.capacity ?? 0),
        status: String(s.status || "scheduled"),
        notes: (s as any).notes ?? null,
        class: {
          id: classId,
          name: programName,
          coach: coachName,
          type: programName,
        },
        attendanceStatus: attendanceBySessionId.get(String((s as any).session_id ?? (s as any).id ?? s.id)) ?? null,
      };
    });

    return NextResponse.json({ ok: true, sessions: out });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
