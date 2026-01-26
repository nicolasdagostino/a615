import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";


// EFFECTIVE_STATUS_MADRID (Option A): completed derivado por horario (Madrid). cancelled viene de DB.
// Si DB ya tiene status="completed", lo respetamos (compat).
function isoTodayMadrid(): string {
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

function nowMinutesMadrid(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hh * 60 + mm;
}

function parseStartMinutes(hhmm: string): number | null {
  const t = String(hhmm || "").trim().slice(0, 5);
  const m = t.match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function effectiveStatusMadrid(row: any, todayISO: string, nowMin: number, timeHHMM: string): "scheduled" | "completed" | "cancelled" {
  const raw = String(row?.status || "").trim().toLowerCase();

  if (raw === "cancelled") return "cancelled";
  if (raw === "completed") return "completed"; // compat

  const dateISO = String(row?.session_date || "").trim();
  if (!dateISO) return "scheduled";

  if (dateISO < todayISO) return "completed";
  if (dateISO > todayISO) return "scheduled";

  const startMin = parseStartMinutes(timeHHMM);
  if (startMin == null) return "scheduled";
  const dur = Number(row?.duration_min ?? 0) || 0;
  const endMin = startMin + Math.max(1, dur);

  return nowMin >= endMin ? "completed" : "scheduled";
}

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

    // B1: block when session completed (POST)
    
if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  
      const admin = createAdminClient();
  
      
// No reservar/cancelar si la sesión ya fue finalizada (status != scheduled)
    try {
      const { data: sess } = await admin
        .from("class_sessions")
        .select("id, status, session_date, start_time, duration_min")
        .eq("id", sessionId)
        .single();
    // EFFECTIVE_STATUS_GUARD (Option A Madrid): no reservar/cancelar si ya terminó o fue cancelada
    const _todayISO = isoTodayMadrid();
    const _nowMin = nowMinutesMadrid();
    const _startHHMM = String((sess as any)?.start_time || "").slice(0, 5);
    const _eff = effectiveStatusMadrid(sess, _todayISO, _nowMin, _startHHMM);

    if (_eff !== "scheduled") {
      return NextResponse.json(
        { error: _eff === "cancelled" ? "Session is cancelled" : "Session is completed" },
        { status: 400 }
      );
    }

      const st = String((sess as any)?.status || "scheduled").toLowerCase();
      if (st !== "scheduled") {
        return NextResponse.json({ error: "Session closed" }, { status: 409 });
      }
    } catch {
      // si falla el check, preferimos bloquear por seguridad
      return NextResponse.json({ error: "Session check failed" }, { status: 409 });
    }

      
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
        const { error: upErr } = await admin.from("reservations")
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

    // B1: block when session completed (PATCH)
    
if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

    const admin = createAdminClient();

    
// No reservar/cancelar si la sesión ya fue finalizada (status != scheduled)
    try {
      const { data: sess } = await admin
        .from("class_sessions")
        .select("id, status, session_date, start_time, duration_min")
        .eq("id", sessionId)
        .single();
    // EFFECTIVE_STATUS_GUARD (Option A Madrid): no reservar/cancelar si ya terminó o fue cancelada
    const _todayISO = isoTodayMadrid();
    const _nowMin = nowMinutesMadrid();
    const _startHHMM = String((sess as any)?.start_time || "").slice(0, 5);
    const _eff = effectiveStatusMadrid(sess, _todayISO, _nowMin, _startHHMM);

    if (_eff !== "scheduled") {
      return NextResponse.json(
        { error: _eff === "cancelled" ? "Session is cancelled" : "Session is completed" },
        { status: 400 }
      );
    }

      const st = String((sess as any)?.status || "scheduled").toLowerCase();
      if (st !== "scheduled") {
        return NextResponse.json({ error: "Session closed" }, { status: 409 });
      }
    } catch {
      // si falla el check, preferimos bloquear por seguridad
      return NextResponse.json({ error: "Session check failed" }, { status: 409 });
    }

    
// --- Cancel guard (Madrid time): no cancelar si ya empezó/pasó o dentro de ventana ---
    const cutoffMin = 30;

    // 1) Traer start de la sesión
    const { data: sess, error: sessErr } = await admin
      .from("class_sessions")
      .select("session_date, start_time")
      .eq("id", sessionId)
      .single();

    if (sessErr || !sess) {
      return NextResponse.json({ error: "Invalid sessionId" }, { status: 400 });
    }

    // 2) Now en Europe/Madrid (ms) usando Date.UTC (independiente del timezone del server)
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(new Date());

    const get = (t: string) => parts.find((p) => p.type === t)?.value || "00";
    const nowY = Number(get("year"));
    const nowM = Number(get("month"));
    const nowD = Number(get("day"));
    const nowH = Number(get("hour"));
    const nowMin = Number(get("minute"));
    const nowS = Number(get("second"));
    const nowMs = Date.UTC(nowY, nowM - 1, nowD, nowH, nowMin, nowS);

    const dateISO = String((sess as any).session_date || "");
    const st = String((sess as any).start_time || "00:00:00");
    const hh = Number(st.slice(0, 2) || "0");
    const mm = Number(st.slice(3, 5) || "0");

    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO);
    if (!m) {
      return NextResponse.json({ error: "Invalid session_date" }, { status: 400 });
    }
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);

    const sessionMs = Date.UTC(y, mo - 1, d, hh, mm, 0);
    const diffMin = Math.floor((sessionMs - nowMs) / 60000);

    // ya empezó o ya pasó
    if (diffMin <= 0) {
      return NextResponse.json({ error: "No podés cancelar una clase ya iniciada o pasada." }, { status: 403 });
    }

    // dentro del cutoff
    if (diffMin < cutoffMin) {
      return NextResponse.json({ error: `La cancelación cierra ${cutoffMin} min antes del inicio.` }, { status: 403 });
    }

    // 3) Si ya hay asistencia registrada para ese user en esa sesión, bloquear cancelación
    const { data: attRow } = await admin
      .from("attendance")
      .select("id")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (attRow) {
      return NextResponse.json({ error: "No podés cancelar: ya hay asistencia registrada para esta sesión." }, { status: 403 });
    }

const { error } = await admin.from("reservations")
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
