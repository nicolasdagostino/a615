import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

function normalizeName(v: any) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  if (s.length > 120) return s.slice(0, 120);
  return s;
}

/**
 * GET /api/admin/programs
 * - list: { ok: true, programs: [{id, name}] }
 * - detail: ?id=... -> { ok: true, program: {id, name} }
 */
export async function GET(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const admin = createAdminClient();
    const url = new URL(req.url);
    const id = String(url.searchParams.get("id") || "").trim();

    if (id) {
      const { data, error } = await admin.from("programs").select("id, name").eq("id", id).single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ ok: true, program: { id: String(data.id), name: String((data as any).name || "") } });
    }

    const { data, error } = await admin.from("programs").select("id, name").order("name", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const programs = (data || []).map((p: any) => ({
      id: String(p.id),
      name: String(p.name || "").trim(),
    }));

    return NextResponse.json({ ok: true, programs }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/programs
 * body: { name }
 */
export async function POST(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json().catch(() => ({} as any));
    const name = normalizeName(body.name);
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("programs")
      .insert({ name })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, id: String((data as any)?.id || "") }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/programs
 * body: { id, name }
 */
export async function PATCH(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json().catch(() => ({} as any));
    const id = String(body.id || "").trim();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const name = normalizeName(body.name);
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin
      .from("programs")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/programs?id=...
 */
export async function DELETE(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const url = new URL(req.url);
    const id = String(url.searchParams.get("id") || "").trim();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin.from("programs").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
