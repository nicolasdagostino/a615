#!/usr/bin/env bash
set -euo pipefail

ts() { date +"%Y%m%d-%H%M%S"; }
RUN_ID="$(ts)"
BK_DIR="logs/backups/$RUN_ID"
mkdir -p "$BK_DIR"

log() { echo "[$(date +"%H:%M:%S")] $*"; }

# Detect route path (src/app or app)
CAND1="src/app/api/athlete/history/route.ts"
CAND2="app/api/athlete/history/route.ts"

if [[ -f "$CAND1" ]]; then
  ROUTE="$CAND1"
elif [[ -f "$CAND2" ]]; then
  ROUTE="$CAND2"
else
  echo "ERROR: no encuentro athlete history route en:"
  echo " - $CAND1"
  echo " - $CAND2"
  exit 1
fi

log "Route detectado: $ROUTE"
mkdir -p "$BK_DIR/$(dirname "$ROUTE")"
cp -a "$ROUTE" "$BK_DIR/$ROUTE"

log "Escribiendo route.ts nuevo (sin classes.name)..."
cat > "$ROUTE" <<'TS'
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

/**
 * GET /api/athlete/history?month=YYYY-MM
 * devuelve sesiones del mes (pasadas), con class.name basado en programs.name (no classes.name).
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const month = String(url.searchParams.get("month") || "").trim(); // YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "month must be YYYY-MM" }, { status: 400 });
    }

    const yy = Number(month.slice(0, 4));
    const mm = Number(month.slice(5, 7));
    const start = firstDayOfMonth(yy, mm);
    const end = firstDayNextMonth(yy, mm);
    const todayISO = isoTodayUTC();

    const admin = createAdminClient();

    // 1) Traer sesiones del mes (pasadas) + id de class
    const { data: sess, error: sErr } = await admin
      .from("class_sessions")
      .select("id, class_id, session_date, time, duration_min, capacity, status, notes")
      .gte("session_date", start)
      .lt("session_date", end)
      .lt("session_date", todayISO)
      .order("session_date", { ascending: true })
      .order("time", { ascending: true });

    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 400 });

    const sessions = Array.isArray(sess) ? sess : [];
    if (sessions.length === 0) return NextResponse.json({ ok: true, sessions: [] });

    const classIds = Array.from(new Set(sessions.map((x: any) => String(x.class_id || "")).filter(Boolean)));

    // 2) Traer clases (sin name)
    const { data: classes, error: cErr } = await admin
      .from("classes")
      .select("id, program_id, coach_id")
      .in("id", classIds);

    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 });

    const byClassId = new Map<string, any>();
    for (const c of (classes || []) as any[]) byClassId.set(String(c.id), c);

    const programIds = Array.from(
      new Set((classes || []).map((c: any) => String(c.program_id || "")).filter(Boolean))
    );
    const coachIds = Array.from(
      new Set((classes || []).map((c: any) => String(c.coach_id || "")).filter(Boolean))
    );

    // 3) Traer programs.name
    const programNameById: Record<string, string> = {};
    if (programIds.length) {
      const { data: progs, error: pErr } = await admin.from("programs").select("id, name").in("id", programIds);
      if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 });
      for (const p of (progs || []) as any[]) programNameById[String(p.id)] = String(p.name || "").trim();
    }

    // 4) Traer coach label
    const coachNameById: Record<string, string> = {};
    if (coachIds.length) {
      const { data: profs, error: prErr } = await admin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", coachIds);
      if (prErr) return NextResponse.json({ error: prErr.message }, { status: 400 });
      for (const p of (profs || []) as any[]) {
        coachNameById[String(p.id)] = String(p.full_name || p.email || "").trim();
      }
    }

    // 5) Attendance status (si existe tabla "attendance" con status)
    //    Si tu esquema tiene otra tabla/nombre, lo dejamos en null (Pending).
    const attendanceBySessionId = new Map<string, "present" | "absent" | null>();
    try {
      const sessionIds = sessions.map((x: any) => String(x.id));
      const { data: atts } = await admin
        .from("attendance")
        .select("session_id, status, cancelled_at, user_id")
        .in("session_id", sessionIds)
        .eq("user_id", user.id)
        .is("cancelled_at", null);

      for (const a of (atts || []) as any[]) {
        const sid = String(a.session_id || "");
        const st = String(a.status || "").toLowerCase();
        if (st === "present") attendanceBySessionId.set(sid, "present");
        else if (st === "absent") attendanceBySessionId.set(sid, "absent");
        else attendanceBySessionId.set(sid, null);
      }
    } catch {
      // si no existe "attendance.status" o la tabla difiere, lo dejamos Pending (null)
    }

    const out = sessions.map((s: any) => {
      const classId = String(s.class_id || "");
      const c = byClassId.get(classId);
      const programId = String(c?.program_id || "");
      const coachId = String(c?.coach_id || "");

      const programName = programNameById[programId] || "Class";
      const coachName = coachNameById[coachId] || "—";

      return {
        id: String(s.id),
        date: String(s.session_date),
        time: String(s.time || ""),
        durationMin: Number(s.duration_min ?? 0),
        capacity: Number(s.capacity ?? 0),
        status: String(s.status || "scheduled"),
        notes: (s as any).notes ?? null,
        class: {
          id: classId,
          name: programName,      // <- ACÁ: ya no depende de classes.name
          coach: coachName,
          type: programName,      // para tu UI actual, usamos el mismo label
        },
        attendanceStatus: attendanceBySessionId.get(String(s.id)) ?? null,
      };
    });

    return NextResponse.json({ ok: true, sessions: out });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
TS

# Por si turbopack se pone sensible
perl -pi -e 's/\x00//g' "$ROUTE" || true

log "Build check..."
npm run build

log "OK. Backup: $BK_DIR"
