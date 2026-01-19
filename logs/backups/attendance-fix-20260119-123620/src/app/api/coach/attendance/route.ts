  import { NextResponse } from "next/server";
  import { createClient } from "@/lib/supabase/server";
  import { createAdminClient } from "@/lib/supabase/admin";

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

  function addDaysISO(dateISO: string, days: number): string {
    const d = new Date(`${dateISO}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + days);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }

  async function requireCoachOrAdmin() {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return { ok: false as const, status: 401, error: "Unauthorized" };

    const admin = createAdminClient();
    const { data: prof, error } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) return { ok: false as const, status: 400, error: error.message };
    const role = String(prof?.role || "").toLowerCase();
    if (role !== "coach" && role !== "admin") return { ok: false as const, status: 403, error: "Forbidden" };

    return { ok: true as const, user, role, admin };
  }

  /**
   * GET /api/coach/attendance?date=YYYY-MM-DD&days=1
   * Devuelve sesiones del rango + lista de reservas y asistencia por atleta.
   */
  export async function GET(req: Request) {
    const auth = await requireCoachOrAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
      const url = new URL(req.url);
      const baseDate = String(url.searchParams.get("date") || "").trim() || isoTodayMadrid();
      const daysRaw = String(url.searchParams.get("days") || "1").trim();
      const days = Math.max(1, Math.min(31, Number(daysRaw) || 1));

      if (!/^\d{4}-\d{2}-\d{2}$/.test(baseDate)) {
        return NextResponse.json({ error: "Invalid date. Use YYYY-MM-DD" }, { status: 400 });
      }

      const dateTo = addDaysISO(baseDate, days); // exclusive

      // sesiones + clase
      const { data: sessions, error: sErr } = await auth.admin
        .from("class_sessions")
        .select(
          `
          id,
          session_date,
          start_time,
          capacity,
          status,
          classes:classes ( id, name, coach, type )
        `
        )
        .gte("session_date", baseDate)
        .lt("session_date", dateTo)
        .order("session_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (sErr) return NextResponse.json({ error: sErr.message }, { status: 400 });

      const sessionIds = (sessions || []).map((s: any) => String(s.id));

      // reservas activas (sin join a profiles porque puede no haber FK en schema cache)
      const { data: resRows, error: rErr } = await auth.admin
        .from("reservations")
        .select("id, session_id, user_id, cancelled_at")
        .in("session_id", sessionIds.length ? sessionIds : ["00000000-0000-0000-0000-000000000000"])
        .is("cancelled_at", null);

      if (rErr) return NextResponse.json({ error: rErr.message }, { status: 400 });

      const userIds = Array.from(new Set((resRows || []).map((r: any) => String(r.user_id))));
  // perfiles de esos users (otra query, sin relación)
      const { data: profRows, error: pErr } = await auth.admin
        .from("profiles")
        .select("id, email, role")
        .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

      if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 });

      const profMap = new Map<string, any>();
      (profRows || []).forEach((p: any) => profMap.set(String(p.id), p));
    // attendance para esas sesiones y users
      const { data: attRows, error: aErr } = await auth.admin
        .from("attendance")
        .select("session_id, user_id, status, updated_at")
        .in("session_id", sessionIds.length ? sessionIds : ["00000000-0000-0000-0000-000000000000"])
        .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

      if (aErr) return NextResponse.json({ error: aErr.message }, { status: 400 });

      const attMap = new Map<string, "present" | "absent">();
      (attRows || []).forEach((a: any) => {
        const key = `${String(a.session_id)}::${String(a.user_id)}`;
        const st = String(a.status || "").toLowerCase();
        if (st === "present" || st === "absent") attMap.set(key, st);
      });

      // agrupar reservas por sesión
      const bySession = new Map<string, any[]>();
      (resRows || []).forEach((r: any) => {
      const sid = String(r.session_id);
      const arr = bySession.get(sid) || [];
      const prof = profMap.get(String(r.user_id));
      arr.push({
reservationId: String(r.id),
          userId: String(r.user_id),
          email: String(prof?.email || ""),
          role: String(prof?.role || ""),
          attendanceStatus: attMap.get(`${sid}::${String(r.user_id)}`) ?? null,
        });
        bySession.set(sid, arr);
      });

      const out = (sessions || []).map((s: any) => {
        const sid = String(s.id);
        const attendees = bySession.get(sid) || [];
        return {
          id: sid,
          date: String(s.session_date),
          time: String(s.start_time).slice(0, 5),
          status: String(s.status || ""),
          capacity: Number(s.capacity || 0),
          class: {
            id: String(s.classes?.id || ""),
            name: String(s.classes?.name || ""),
            coach: String(s.classes?.coach || ""),
            type: String(s.classes?.type || ""),
          },
          attendees,
        };
      });

      return NextResponse.json({ ok: true, date: baseDate, days, sessions: out });
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
    }
  }

  /**
   * POST /api/coach/attendance
   * body: { sessionId, userId, status: "present"|"absent" }
   * Upsert.
   */
  export async function POST(req: Request) {
    const auth = await requireCoachOrAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
      const body = await req.json().catch(() => ({} as any));
      const sessionId = String(body.sessionId || "").trim();
      const userId = String(body.userId || "").trim();
      const status = String(body.status || "").trim().toLowerCase();

      if (!sessionId || !userId) return NextResponse.json({ error: "sessionId and userId are required" }, { status: 400 });
      if (status !== "present" && status !== "absent") {
        return NextResponse.json({ error: 'status must be "present" or "absent"' }, { status: 400 });
      }

      const { error } = await auth.admin
        .from("attendance")
        .upsert(
        {
          session_id: sessionId,
          user_id: userId,
          status,
          marked_by: auth.user.id,
          marked_at: new Date().toISOString(),
        },
        { onConflict: "session_id,user_id" }
      );

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      return NextResponse.json({ ok: true });
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
    }
  }

  /**
   * DELETE /api/coach/attendance
   * body: { sessionId } -> borra attendance de esa sesión (reset).
   */
  export async function DELETE(req: Request) {
    const auth = await requireCoachOrAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
      const body = await req.json().catch(() => ({} as any));
      const sessionId = String(body.sessionId || "").trim();
      if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

      const { error } = await auth.admin
        .from("attendance")
        .delete()
        .eq("session_id", sessionId);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      return NextResponse.json({ ok: true });
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
    }
  }
