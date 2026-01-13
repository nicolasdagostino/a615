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
 * GET /api/athlete/reservations/history?date=YYYY-MM-DD&days=31
 * Devuelve mis reservas (incluye canceladas) con sesión+clase.
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const baseDate = String(url.searchParams.get("date") || "").trim() || isoTodayUTC();
    const daysRaw = String(url.searchParams.get("days") || "31").trim();
    const days = Math.max(1, Math.min(93, Number(daysRaw) || 31)); // hasta ~3 meses por si querés

    if (!/^\d{4}-\d{2}-\d{2}$/.test(baseDate)) {
      return NextResponse.json({ error: "Invalid date. Use YYYY-MM-DD" }, { status: 400 });
    }

    const dateTo = addDaysISO(baseDate, days); // exclusive

    const admin = createAdminClient();

    // Traemos reservas del usuario con join a class_sessions y classes.
    // Nota: no filtramos por cancelled_at acá (queremos historial real).
    const { data, error } = await admin
      .from("reservations")
      .select(`
        id,
        session_id,
        created_at,
        cancelled_at,
        class_sessions!inner (
          id,
          session_date,
          start_time,
          duration_min,
          capacity,
          status,
          notes,
          classes:classes (
            id, name, coach, type
          )
        )
      `)
      .eq("user_id", user.id)
      // Filtro por rango de fecha sobre la sesión (join)
      // (Supabase permite filtrar en joined columns con la notación tabla.columna)
      .gte("class_sessions.session_date", baseDate)
      .lt("class_sessions.session_date", dateTo)
      .order("class_sessions.session_date", { ascending: false })
      .order("class_sessions.start_time", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const items = (data || []).map((r: any) => {
      const cs = r.class_sessions || {};
      const c = cs.classes || {};
      const cancelled = !!r.cancelled_at;

      return {
        reservationId: String(r.id),
        sessionId: String(r.session_id),
        createdAt: String(r.created_at),
        cancelledAt: r.cancelled_at ? String(r.cancelled_at) : null,
        cancelled,
        session: {
          id: String(cs.id || r.session_id),
          date: String(cs.session_date || ""),
          time: String(cs.start_time || "").slice(0, 5),
          durationMin: Number(cs.duration_min ?? 60),
          capacity: Number(cs.capacity ?? 0),
          status: String(cs.status || ""),
          notes: cs.notes ?? null,
        },
        class: {
          id: String(c.id || ""),
          name: String(c.name || ""),
          coach: String(c.coach || ""),
          type: String(c.type || ""),
        },
      };
    });

    return NextResponse.json({ ok: true, date: baseDate, days, items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
