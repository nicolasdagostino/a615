import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type AttendanceStatus = "present" | "absent" | null;

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

function firstDayOfMonthISO(year: number, month: number) {
  return `${year}-${pad2(month)}-01`;
}

function addMonthsISO(year: number, month: number, add: number) {
  const d = new Date(Date.UTC(year, month - 1, 1));
  d.setUTCMonth(d.getUTCMonth() + add);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  return { year: y, month: m, iso: firstDayOfMonthISO(y, m) };
}

/**
 * GET /api/athlete/history?month=YYYY-MM
 * Devuelve SOLO sesiones del mes donde:
 *  - el usuario tenía reserva activa (cancelled_at IS NULL)
 *  - y la sesión ya ocurrió (session_date < hoy Madrid)
 * Incluye attendanceStatus (present/absent/null)
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const monthParam = String(url.searchParams.get("month") || "").trim(); // YYYY-MM

    const now = new Date();
    const defaultYear = now.getFullYear();
    const defaultMonth = now.getMonth() + 1;

    let year = defaultYear;
    let month = defaultMonth;

    if (/^\d{4}-\d{2}$/.test(monthParam)) {
      year = Number(monthParam.slice(0, 4));
      month = Number(monthParam.slice(5, 7));
    }

    if (!(year >= 2000 && year <= 2100 && month >= 1 && month <= 12)) {
      return NextResponse.json({ error: "Invalid month. Use YYYY-MM" }, { status: 400 });
    }

    const fromISO = firstDayOfMonthISO(year, month);
    const toISO = addMonthsISO(year, month, 1).iso; // exclusivo
    const todayISO = isoTodayMadrid();

    const admin = createAdminClient();

    // 1) Traer sesiones del mes (con class)
    const { data: sessions, error: sErr } = await admin
      .from("class_sessions")
      .select(
        `
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
      `
      )
      .gte("session_date", fromISO)
      .lt("session_date", toISO)
      .order("session_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 400 });

    const all = (sessions || []) as any[];
    const ids = all.map((x) => x.id);

    if (!ids.length) {
      return NextResponse.json({ ok: true, month: `${year}-${pad2(month)}`, sessions: [] });
    }

    // 2) Reservas activas del usuario (solo esas entran al historial)
    const { data: myRes, error: rErr } = await admin
      .from("reservations")
      .select("session_id")
      .eq("user_id", user.id)
      .is("cancelled_at", null)
      .in("session_id", ids);

    if (rErr) return NextResponse.json({ error: rErr.message }, { status: 400 });

    const myReservedSet = new Set<string>((myRes || []).map((r: any) => String(r.session_id)));

    // 3) Attendance status (si existe)
    const { data: attRows, error: aErr } = await admin
      .from("attendance")
      .select("session_id, status")
      .eq("user_id", user.id)
      .in("session_id", ids);

    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 400 });

    const attMap = new Map<string, AttendanceStatus>();
    (attRows || []).forEach((r: any) => {
      const sid = String(r.session_id);
      const st = String(r.status || "").toLowerCase();
      attMap.set(sid, st === "present" ? "present" : st === "absent" ? "absent" : null);
    });

    // 4) Respuesta final: solo reservadas y pasadas
    const out = all
      .filter((s) => myReservedSet.has(String(s.id)))
      .filter((s) => String(s.session_date) < todayISO) // pasado (comparación ISO funciona)
      .map((s) => {
        const attendanceStatus = attMap.get(String(s.id)) ?? null;

        return {
          id: String(s.id),
          date: String(s.session_date),
          time: String(s.start_time).slice(0, 5),
          durationMin: Number(s.duration_min ?? 60),
          capacity: Number(s.capacity ?? 12),
          status: String(s.status || "scheduled"),
          notes: s.notes ?? null,
          class: {
            id: String(s.classes?.id || s.class_id),
            name: String(s.classes?.name || ""),
            coach: String(s.classes?.coach || ""),
            type: String(s.classes?.type || ""),
          },
          attendanceStatus,
        };
      });

    return NextResponse.json({ ok: true, month: `${year}-${pad2(month)}`, sessions: out });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
