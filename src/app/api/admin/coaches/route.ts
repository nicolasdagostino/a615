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

export async function GET() {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const admin = createAdminClient();

    // Coaches list = admin + coach
    const { data: profs, error } = await admin
      .from("profiles")
      .select("id, full_name, email, role")
      .in("role", ["admin", "coach"])
      .order("full_name", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const coaches = (profs || [])
      .map((p: any) => {
        const label = String(p.full_name || p.email || "User").trim();
        return { id: String(p.id), label };
      })
      .filter((c: any) => c.id && c.label);

    return NextResponse.json({ coaches }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
