import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  // Auth required (no role restriction)
  const supabase = await createClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // 1) Active reservations for the session
  const { data: reservations, error: rErr } = await admin
    .from("reservations")
    .select("user_id")
    .eq("session_id", sessionId)
    .is("cancelled_at", null);

  if (rErr) {
    return NextResponse.json({ error: rErr.message }, { status: 500 });
  }

  const userIds = Array.from(new Set((reservations ?? []).map((r: any) => r.user_id).filter(Boolean)));
  if (userIds.length === 0) {
    return NextResponse.json({ attendees: [] }, { status: 200 });
  }

  // 2) Profiles (full_name)
  const { data: profiles, error: pErr } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }

  const profMap = new Map((profiles ?? []).map((p: any) => [String(p.id), p]));

  const attendees = userIds
    .map((id) => {
      const p = profMap.get(String(id));
      const fullName = String(p?.full_name || "").trim();
      return {
        userId: String(id),
        fullName: fullName || null,
      };
    })
    .sort((a, b) => String(a.fullName || a.userId).localeCompare(String(b.fullName || b.userId)));

  return NextResponse.json({ attendees }, { status: 200 });
}
