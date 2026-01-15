<import { NextResponse } from "next/server";
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
  if ((profile as any)?.role !== "admin") {
    return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const };
}

export async function GET() {
  const auth = await assertAdmin();
  if (!auth.ok) return auth.res;

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "coach")
    .order("full_name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const coaches = (data || []).map((p: any) => {
    const fullName = String(p.full_name || "").trim();
    const email = String(p.email || "").trim();
    return {
      id: String(p.id),
      fullName: fullName || email || "Coach",
    };
  });

  return NextResponse.json({ coaches }, { status: 200 });
}
>
