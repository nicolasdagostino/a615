import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  // Auth required (pero sin restricción de rol)
  const supabase = await createClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // 1) reservations activas de la sesión
  const { data: reservations, error: rErr } = await admin
    .from("reservations")
    .select("user_id")
    .eq("session_id", sessionId)
    .is("cancelled_at", null);

  if (rErr) {
    return NextResponse.json({ error: rErr.message }, { status: 500 });
  }

  const userIds = Array.from(new Set((reservations ?? []).map((r) => r.user_id).filter(Boolean)));
  if (userIds.length === 0) {
    return NextResponse.json({ attendees: [] }, { status: 200 });
  }

  // 2) profiles para emails
  const { data: profiles, error: pErr } = await admin
    .from("profiles")
    .select("id,email,role")
    .in("id", userIds);

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }

  const profMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const attendees = userIds
    .map((id) => {
      const p = profMap.get(id);
      return {
        userId: id,
        email: p?.email ?? null,
        role: p?.role ?? null,
      };
    })
    .sort((a, b) => String(a.email ?? a.userId).localeCompare(String(b.email ?? b.userId)));

  return NextResponse.json({ attendees }, { status: 200 });
}
