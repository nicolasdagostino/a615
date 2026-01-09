import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const wodId = String(url.searchParams.get("wodId") || "").trim();
    if (!wodId) return NextResponse.json({ error: "wodId is required" }, { status: 400 });

    const admin = createAdminClient();

    // Verificamos que el WOD esté publicado
    const { data: wod, error: wErr } = await admin.from("wods").select("id, is_published").eq("id", wodId).single();
    if (wErr) return NextResponse.json({ error: wErr.message }, { status: 400 });
    if (!wod) return NextResponse.json({ error: "WOD not found" }, { status: 404 });
    if (!(wod as any).is_published) return NextResponse.json({ error: "WOD not published" }, { status: 403 });

    // comments + author name (profiles.full_name)
    const { data, error } = await admin
      .from("wod_comments")
      .select("id, wod_id, user_id, body, created_at")
      .eq("wod_id", wodId)
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const comments = (data || []) as any[];
    const userIds = Array.from(new Set(comments.map((c) => String(c.user_id || "")).filter(Boolean)));

    let namesById: Record<string, string> = {};
    if (userIds.length) {
      const { data: profs } = await admin.from("profiles").select("id, full_name, email").in("id", userIds);
      namesById = Object.fromEntries(
        (profs || []).map((p: any) => [
          String(p.id),
          String(p.full_name || p.email || "User").trim(),
        ])
      );
    }

    const rows = comments.map((c) => ({
      id: String(c.id),
      wodId: String(c.wod_id),
      userId: String(c.user_id),
      author: namesById[String(c.user_id)] || "User",
      body: String(c.body || ""),
      createdAt: String(c.created_at || ""),
    }));

    return NextResponse.json({ ok: true, comments: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({} as any));
    const wodId = String(body.wodId || "").trim();
    const text = String(body.body || "").trim();

    if (!wodId) return NextResponse.json({ error: "wodId is required" }, { status: 400 });
    if (!text) return NextResponse.json({ error: "body is required" }, { status: 400 });

    const admin = createAdminClient();

    // solo si está publicado
    const { data: wod, error: wErr } = await admin.from("wods").select("id, is_published").eq("id", wodId).single();
    if (wErr) return NextResponse.json({ error: wErr.message }, { status: 400 });
    if (!wod) return NextResponse.json({ error: "WOD not found" }, { status: 404 });
    if (!(wod as any).is_published) return NextResponse.json({ error: "WOD not published" }, { status: 403 });

    const { data, error } = await admin
      .from("wod_comments")
      .insert({
        wod_id: wodId,
        user_id: user.id,
        body: text,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, id: String((data as any)?.id || "") });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
