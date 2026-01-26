import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Role = "admin" | "coach" | "athlete" | string;

async function assertStaff() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: prof, error: pErr } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (pErr) {
    return { ok: false as const, res: NextResponse.json({ error: pErr.message }, { status: 400 }) };
  }

  const role = String((prof as any)?.role || "").toLowerCase() as Role;
  if (role !== "admin" && role !== "coach") {
    return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const, userId: user.id, role };
}

/**
 * GET /api/coach/attendance?sessionId=...
 * ✅ Devuelve roster + attendanceStatus para el modal (coach/admin).
 * IMPORTANTE: NO usa classes.name (no existe). Usa programs.name.
 */
export async function GET(req: Request) {
  try {
    const auth = await assertStaff();
    if (!auth.ok) return auth.res;

    const url = new URL(req.url);
    const sessionId = String(url.searchParams.get("sessionId") || "").trim();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const sid = sessionId;

    // 1) Session
    const { data: sess, error: sErr } = await admin
      .from("class_sessions")
      .select("id, class_id, session_date, start_time")
      .eq("id", sid)
      .single();

    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 400 });
    if (!sess) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const classId = String((sess as any).class_id || "");

    // 2) class -> program_id
    let programId = "";
    if (classId) {
      const { data: cls, error: cErr } = await admin
        .from("classes")
        .select("id, program_id")
        .eq("id", classId)
        .single();

      if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 });
      programId = String((cls as any)?.program_id || "");
    }

    // 3) program -> name
    let programName = "";
    if (programId) {
      const { data: prog, error: pErr } = await admin
        .from("programs")
        .select("name")
        .eq("id", programId)
        .single();

      if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 });
      programName = String((prog as any)?.name || "").trim();
    }

    // 4) Reservations activas
    const { data: resRows, error: rErr } = await admin
      .from("reservations")
      .select("id, user_id")
      .eq("session_id", sid)
      .is("cancelled_at", null);

    if (rErr) return NextResponse.json({ error: rErr.message }, { status: 400 });

    const reservations = (resRows || []) as any[];
    const userIds = Array.from(new Set(reservations.map((r) => String(r.user_id || "")).filter(Boolean)));

    // 5) Profiles (email/role)
    let profById: Record<string, { email?: string | null; role?: string | null }> = {};
    if (userIds.length) {
      const { data: profs, error: profErr } = await admin
        .from("profiles")
        .select("id, email, role")
        .in("id", userIds);

      if (profErr) return NextResponse.json({ error: profErr.message }, { status: 400 });

      profById = Object.fromEntries(
        (profs || []).map((p: any) => [String(p.id), { email: p.email ?? null, role: p.role ?? null }])
      );
    }

    // 6) Attendance para esos users
    const attMap = new Map<string, "present" | "absent" | null>();
    if (userIds.length) {
      const { data: atts, error: aErr } = await admin
        .from("attendance")
        .select("user_id, status")
        .eq("session_id", sid)
        .in("user_id", userIds);

      if (aErr) return NextResponse.json({ error: aErr.message }, { status: 400 });

      (atts || []).forEach((a: any) => {
        const uid = String(a.user_id || "");
        const st = String(a.status || "").toLowerCase();
        attMap.set(uid, st === "present" ? "present" : st === "absent" ? "absent" : null);
      });
    }

    const attendees = reservations.map((r) => {
      const uid = String(r.user_id || "");
      const prof = profById[uid] || {};
      return {
        reservationId: String(r.id || ""),
        userId: uid,
        email: prof.email ?? null,
        role: prof.role ?? null,
        attendanceStatus: attMap.get(uid) ?? null,
      };
    });

    const sessionLabel =
      `${programName || "Session"} · ${String((sess as any).session_date || "")} ${String((sess as any).start_time || "").slice(0, 5)}`.trim();

    return NextResponse.json({
      ok: true,
      session: {
            status: String((sess as any)?.status || "scheduled"),
            
        id: String((sess as any).id),
        sessionLabel,
        attendees,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/coach/attendance
 * body: { sessionId, userId, status: "present"|"absent" }
 * Upsert attendance.
 */
export async function POST(req: Request) {
  try {
    const auth = await assertStaff();
    if (!auth.ok) return auth.res;

    const body = await req.json().catch(() => ({} as any));
    const sessionId = String(body.sessionId || "").trim();
    const userId = String(body.userId || "").trim();
    const statusRaw = String(body.status || "").trim().toLowerCase();

    const status = statusRaw === "present" ? "present" : statusRaw === "absent" ? "absent" : "";
    if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    if (!status) return NextResponse.json({ error: "status must be present|absent" }, { status: 400 });

    const admin = createAdminClient();

    const { error } = await admin
      .from("attendance")
      .upsert(
        {
session_id: sessionId,
          user_id: userId,
          status,
          marked_by: auth.userId,
          marked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();

    // role check
    const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const role = String((prof as any)?.role || "").toLowerCase();
    if (role !== "admin" && role !== "coach") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const sessionId = String((body as any)?.sessionId || "").trim();
    const action = String((body as any)?.action || "close").trim().toLowerCase(); // close | reopen

    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const nextStatus = action === "reopen" ? "scheduled" : "completed";

    const { error: upErr } = await admin
      .from("class_sessions")
      .update({ status: nextStatus })
      .eq("id", sessionId);

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

    return NextResponse.json({ ok: true, sessionId, status: nextStatus });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await assertStaff();
    if (!auth.ok) return auth.res;

    const body = await req.json().catch(() => ({} as any));
    const sessionId = String(body.sessionId || "").trim();
    if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin.from("attendance").delete().eq("session_id", sessionId);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
