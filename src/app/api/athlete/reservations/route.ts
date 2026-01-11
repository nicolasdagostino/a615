import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/athlete/reservations
 * body: { sessionId: string }
 */
export async function POST(req: Request) {
    try {
      const supabase = await createClient();
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
  
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
      const body = await req.json().catch(() => ({} as any));
      const sessionId = String(body.sessionId || "").trim();
      if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  
      const admin = createAdminClient();
  
      // 1) Cargar sesión
      const { data: s, error: sErr } = await admin
        .from("class_sessions")
        .select("id, session_date, start_time, capacity, status")
        .eq("id", sessionId)
        .single();
  
      if (sErr) return NextResponse.json({ error: sErr.message }, { status: 400 });
      if (!s) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  
      if (String(s.status).toLowerCase() !== "scheduled") {
        return NextResponse.json({ error: "Session not available" }, { status: 400 });
      }
  
      // 2) Evitar solapamiento: no permitir otra reserva misma date + time
      const { data: overlaps } = await admin
        .from("reservations")
        .select("id, session_id, class_sessions!inner(session_date, start_time)")
        .eq("user_id", user.id)
        .is("cancelled_at", null);
  
      const hasOverlap = (overlaps || []).some((r: any) => {
        const cs = r.class_sessions;
        return String(cs?.session_date) === String(s.session_date) && String(cs?.start_time) === String(s.start_time);
      });
  
      if (hasOverlap) {
        return NextResponse.json({ error: "Ya tenés una clase en ese horario." }, { status: 400 });
      }
  
      // 3) Chequear si ya existe reserva (activa o cancelada)
      const { data: existing, error: exErr } = await admin
        .from("reservations")
        .select("id, cancelled_at")
        .eq("user_id", user.id)
        .eq("session_id", sessionId)
        .maybeSingle();
  
      if (exErr) return NextResponse.json({ error: exErr.message }, { status: 400 });
  
      // Si ya está activa
      if (existing && !existing.cancelled_at) {
        return NextResponse.json({ error: "Ya estás reservado." }, { status: 400 });
      }
  
      // 4) Chequear cupo (solo si vamos a reservar/reactivar)
      const { data: cnt } = await admin
        .from("v_session_reserved_counts")
        .select("reserved_count")
        .eq("session_id", sessionId)
        .maybeSingle();
  
      const reservedCount = Number((cnt as any)?.reserved_count || 0);
      const capacity = Number(s.capacity || 0);
      if (capacity > 0 && reservedCount >= capacity) {
        return NextResponse.json({ error: "La clase está completa." }, { status: 400 });
      }
  
      // 5) Si existe cancelada -> reactivar
      if (existing && existing.cancelled_at) {
        const { error: upErr } = await admin
          .from("reservations")
          .update({ cancelled_at: null })
          .eq("id", existing.id);
  
        if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });
        return NextResponse.json({ ok: true, id: String(existing.id) });
      }
  
      // 6) Insert reserva nueva
      const { data: ins, error: insErr } = await admin
        .from("reservations")
        .insert({ session_id: sessionId, user_id: user.id })
        .select("id")
        .single();
  
      if (insErr) {
        if (String(insErr.message || "").toLowerCase().includes("duplicate")) {
          return NextResponse.json({ error: "Ya estás reservado." }, { status: 400 });
        }
        return NextResponse.json({ error: insErr.message }, { status: 400 });
      }
  
      return NextResponse.json({ ok: true, id: String((ins as any)?.id || "") });
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
    }
  }
  

/**
 * PATCH /api/athlete/reservations
 * body: { sessionId: string }  -> cancela (soft)
 */
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({} as any));
    const sessionId = String(body.sessionId || "").trim();
    if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

    const admin = createAdminClient();

    const { error } = await admin
      .from("reservations")
      .update({ cancelled_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("session_id", sessionId)
      .is("cancelled_at", null);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
