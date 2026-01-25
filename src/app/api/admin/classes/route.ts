import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function toTitle(s: string) {
  const v = String(s || "").trim();
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : "";
}

function mapDayToUi(v: string): string {
  const s = String(v || "").trim().toLowerCase();
  if (s === "mon") return "Mon";
  if (s === "tue") return "Tue";
  if (s === "wed") return "Wed";
  if (s === "thu") return "Thu";
  if (s === "fri") return "Fri";
  if (s === "sat") return "Sat";
  if (s === "sun") return "Sun";
  return toTitle(s);
}

async function assertAdmin() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (String((profile as any)?.role || "").toLowerCase() !== "admin") {
    return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const, userId: user.id };
}

/**
 * GET /api/admin/classes
 * - list: { ok: true, classes: [...] }  (por defecto NO muestra inactive)
 * - detail: ?id=... -> { ok: true, class: {...} } (devuelve aunque esté inactive)
 */
export async function GET(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const admin = createAdminClient();
    const url = new URL(req.url);
    const includeInactive = String(url.searchParams.get("includeInactive") || "").trim() === "1";
    const idParam = String(url.searchParams.get("id") || "").trim();

    // DETAIL
    if (idParam) {
      const { data: one, error: oneErr } = await admin
        .from("classes")
        .select("id, program_id, coach_id, day, time, duration_min, capacity, status, is_active")
        .eq("id", idParam)
        .single();

      if (oneErr) return NextResponse.json({ error: oneErr.message }, { status: 400 });
      if (!one) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const programId = String((one as any).program_id || "");
      const coachId = String((one as any).coach_id || "");

      let programName = "";
      if (programId) {
        const { data: p } = await admin.from("programs").select("name").eq("id", programId).single();
        programName = String((p as any)?.name || "").trim();
      }

      let coachName = "";
      if (coachId) {
        const { data: prof } = await admin.from("profiles").select("full_name, email").eq("id", coachId).single();
        coachName = String((prof as any)?.full_name || (prof as any)?.email || "").trim();
      }

      return NextResponse.json({
        ok: true,
        class: {
          id: String((one as any).id),
          programId,
          program: programName || "—",
          coachId,
          coach: coachName || "—",
          day: String((one as any).day || ""),
          time: String((one as any).time || ""),
          durationMin:
            (one as any).duration_min === null || (one as any).duration_min === undefined
              ? ""
              : String((one as any).duration_min),
          capacity:
            (one as any).capacity === null || (one as any).capacity === undefined
              ? ""
              : String((one as any).capacity),
          status: String((one as any).status || "scheduled"),
          isActive: Boolean((one as any).is_active ?? true),
        },
      });
    }

    // LIST (por defecto SOLO activas; includeInactive=1 muestra todas)
    let q = admin
      .from("classes")
      .select("id, program_id, coach_id, day, time, duration_min, capacity, status, is_active");

    if (!includeInactive) {
      q = q.eq("is_active", true);
    }

    const { data, error } = await q
      .order("day", { ascending: true })
      .order("time", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const programIds = Array.from(new Set((data || []).map((r: any) => String(r.program_id || "")).filter(Boolean)));
    const coachIds = Array.from(new Set((data || []).map((r: any) => String(r.coach_id || "")).filter(Boolean)));

    let programNameById: Record<string, string> = {};
    if (programIds.length) {
      const { data: progs, error: prErr } = await admin.from("programs").select("id, name").in("id", programIds);
      if (prErr) return NextResponse.json({ error: prErr.message }, { status: 400 });
      programNameById = Object.fromEntries((progs || []).map((p: any) => [String(p.id), String(p.name || "Program").trim()]));
    }

    let coachNameById: Record<string, string> = {};
    if (coachIds.length) {
      const { data: profs, error: pErr } = await admin.from("profiles").select("id, full_name, email").in("id", coachIds);
      if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 });
      coachNameById = Object.fromEntries((profs || []).map((p: any) => [String(p.id), String(p.full_name || p.email || "Coach").trim()]));
    }

    const rows = (data || []).map((r: any) => {
      const programId = String(r.program_id || "");
      const coachId = String(r.coach_id || "");
      return {
        id: String(r.id),
        programId,
        // Compat: algunas pantallas esperan "name"
        name: programNameById[programId] || "—",
        program: programNameById[programId] || "—",
        coachId,
        coach: coachNameById[coachId] || "—",
        day: mapDayToUi(String(r.day || "")),
        time: String(r.time || ""),
        durationMin: Number(r.duration_min ?? 0),
        capacity: Number(r.capacity ?? 0),
        status: "Scheduled",
        isActive: Boolean(r.is_active ?? true),
      };
    });

    return NextResponse.json({ ok: true, classes: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/classes
 * body: { programId, coachId, day, time, durationMin, capacity, status }
 */
export async function POST(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json().catch(() => ({} as any));

    const programId = String(body.programId || "").trim();
    const coachId = String(body.coachId || "").trim();
    const day = String(body.day || "").trim().toLowerCase();
    const time = String(body.time || "").trim();
    const status = String(body.status || "scheduled").trim().toLowerCase();

    const durationRaw = String(body.durationMin || "").trim();
    const capacityRaw = String(body.capacity || "").trim();
    const durationMin = durationRaw ? Number(durationRaw) : 0;
    const capacity = capacityRaw ? Number(capacityRaw) : 0;

    if (!programId) return NextResponse.json({ error: "programId is required" }, { status: 400 });
    if (!coachId) return NextResponse.json({ error: "coachId is required" }, { status: 400 });
    if (!day) return NextResponse.json({ error: "day is required" }, { status: 400 });
    if (!time) return NextResponse.json({ error: "time is required" }, { status: 400 });

    if (Number.isNaN(durationMin) || durationMin <= 0) return NextResponse.json({ error: "Invalid durationMin" }, { status: 400 });
    if (Number.isNaN(capacity) || capacity <= 0) return NextResponse.json({ error: "Invalid capacity" }, { status: 400 });

    const admin = createAdminClient();

    const { data: prog } = await admin.from("programs").select("id").eq("id", programId).single();
    if (!prog) return NextResponse.json({ error: "Invalid programId" }, { status: 400 });

    const { data: prof } = await admin.from("profiles").select("id").eq("id", coachId).single();
    if (!prof) return NextResponse.json({ error: "Invalid coachId" }, { status: 400 });

    const { data, error } = await admin
      .from("classes")
      .insert({
        program_id: programId,
        coach_id: coachId,
        day,
        time,
        duration_min: durationMin,
        capacity,
        status,
        is_active: true,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, id: String((data as any)?.id || "") });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/classes
 */
export async function PATCH(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json().catch(() => ({} as any));

    const id = String(body.id || "").trim();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const programId = String(body.programId || "").trim();
    const coachId = String(body.coachId || "").trim();
    const day = String(body.day || "").trim().toLowerCase();
    const time = String(body.time || "").trim();
    const status = String(body.status || "scheduled").trim().toLowerCase();

    const durationRaw = String(body.durationMin || "").trim();
    const capacityRaw = String(body.capacity || "").trim();
    const durationMin = durationRaw ? Number(durationRaw) : 0;
    const capacity = capacityRaw ? Number(capacityRaw) : 0;

    if (!programId) return NextResponse.json({ error: "programId is required" }, { status: 400 });
    if (!coachId) return NextResponse.json({ error: "coachId is required" }, { status: 400 });
    if (!day) return NextResponse.json({ error: "day is required" }, { status: 400 });
    if (!time) return NextResponse.json({ error: "time is required" }, { status: 400 });

    if (Number.isNaN(durationMin) || durationMin <= 0) return NextResponse.json({ error: "Invalid durationMin" }, { status: 400 });
    if (Number.isNaN(capacity) || capacity <= 0) return NextResponse.json({ error: "Invalid capacity" }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin
      .from("classes")
      .update({
        program_id: programId,
        coach_id: coachId,
        day,
        time,
        duration_min: durationMin,
        capacity,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/classes?id=...
 * Soft delete: deja historial intacto y limpia FUTURAS sesiones.
 */
/**
 * DELETE /api/admin/classes?id=...
 * Soft delete: deja historial intacto y cancela FUTURAS sesiones (no borra filas).
 */
export async function DELETE(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const url = new URL(req.url);
    const id = String(url.searchParams.get("id") || "").trim();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const admin = createAdminClient();

    // "Hoy" en Madrid (YYYY-MM-DD)
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const y = parts.find((p) => p.type === "year")?.value ?? "1970";
    const m = parts.find((p) => p.type === "month")?.value ?? "01";
    const d = parts.find((p) => p.type === "day")?.value ?? "01";
    const todayISO = `${y}-${m}-${d}`;

    // 1) Soft-delete: inactivar clase
    const { error: clsErr } = await admin
      .from("classes")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (clsErr) return NextResponse.json({ error: clsErr.message }, { status: 400 });

    // 2) Cancelar sesiones FUTURAS (NO borrar)
    const { error: sessUpdErr } = await admin
      .from("class_sessions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("class_id", id)
      .gte("session_date", todayISO);

    if (sessUpdErr) return NextResponse.json({ error: sessUpdErr.message }, { status: 400 });

    // 3) Traer ids de sesiones futuras (para cancelar reservas activas)
    const { data: futureSessions, error: sessErr } = await admin
      .from("class_sessions")
      .select("id")
      .eq("class_id", id)
      .gte("session_date", todayISO);

    if (sessErr) return NextResponse.json({ error: sessErr.message }, { status: 400 });

    const sessionIds = (futureSessions || []).map((s: any) => String(s.id)).filter(Boolean);

    // 4) Cancelar reservas activas de esas sesiones
    if (sessionIds.length) {
      const { error: resErr } = await admin
        .from("reservations")
        .update({ cancelled_at: new Date().toISOString() })
        .in("session_id", sessionIds)
        .is("cancelled_at", null);

      if (resErr) return NextResponse.json({ error: resErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}


