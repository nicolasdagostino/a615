import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type AppRole = "admin" | "coach" | "athlete";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1) Validar sesión
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2) Validar admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    const fullName = (body.fullName ?? body.name ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim().toLowerCase();
    const role = (body.role ?? "").toString().trim() as AppRole;
    const phone = (body.phone ?? "").toString().trim();

    if (!fullName) {
      return NextResponse.json({ error: "fullName is required" }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Este endpoint es para staff: restringimos a admin|coach para no romper tu modelo
    if (role !== "admin" && role !== "coach") {
      return NextResponse.json(
        { error: 'Invalid role. Allowed: "admin" | "coach".' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const redirectTo =
      `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/set-password`;

    // 3) Invitar usuario por email
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { fullName, role, phone },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = (data as any)?.user?.id ?? null;

    // 4) Upsert profile (si tenemos userId)
    if (userId) {
      const { error: upsertErr } = await admin.from("profiles").upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          role,
          phone: phone || null,
        },
        { onConflict: "id" }
      );

      if (upsertErr) {
        return NextResponse.json({ error: upsertErr.message }, { status: 400 });
      }
    }

    return NextResponse.json({
      ok: true,
      invited: true,
      email,
      userId,
      redirectTo,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
