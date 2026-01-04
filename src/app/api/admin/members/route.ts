import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim() || null;
    const dob = String(body.dob || "").trim() || null;
    const notes = String(body.notes || "").trim() || null;

    const plan = String(body.plan || "").trim() || null;
    const monthlyFeeRaw = String(body.monthlyFee || "").trim();
    const monthlyFee = monthlyFeeRaw ? Number(monthlyFeeRaw.replace(",", ".")) : null;

    const startDate = String(body.startDate || "").trim() || null;
    const expiresAt = String(body.expiresAt || "").trim() || null;

    const creditsRaw = String(body.credits || "").trim();
    const credits = creditsRaw ? Number(creditsRaw) : null;

    const status = String(body.status || "").trim() || null;
    const paymentMethod = String(body.paymentMethod || "").trim() || null;

    if (!fullName) return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    if (!email || !email.includes("@")) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    if (monthlyFee !== null && Number.isNaN(monthlyFee)) return NextResponse.json({ error: "Invalid monthly fee" }, { status: 400 });
    if (credits !== null && Number.isNaN(credits)) return NextResponse.json({ error: "Invalid credits" }, { status: 400 });

    const admin = createAdminClient();
    const redirectTo =
      `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/set-password`;

    // 3) Invitar usuario (athlete) por email
    const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { fullName, role: "athlete", phone },
    });

    if (inviteErr) {
      return NextResponse.json({ error: inviteErr.message }, { status: 400 });
    }

    const invitedUserId = (invited as any)?.user?.id ?? null;

    // 4) Crear/actualizar profile (si tenemos userId)
    if (invitedUserId) {
      const { error: upsertErr } = await admin
        .from("profiles")
        .upsert({ id: invitedUserId, email, role: "athlete", full_name: fullName, phone }, { onConflict: "id" });

      if (upsertErr) {
        return NextResponse.json({ error: upsertErr.message }, { status: 400 });
      }
    }

    // 5) Guardar member + membership (linkeando al user_id si lo tenemos)
    const { data: member, error: memberErr } = await admin
      .from("members")
      .insert({
        user_id: invitedUserId,
        full_name: fullName,
        email,
        phone,
        dob: dob || null,
        notes,
      })
      .select("*")
      .single();

    if (memberErr || !member) {
      return NextResponse.json({ error: memberErr?.message || "Failed to create member" }, { status: 400 });
    }

    const { error: membershipErr } = await admin.from("memberships").insert({
      member_id: member.id,
      plan,
      monthly_fee: monthlyFee,
      start_date: startDate || null,
      expires_at: expiresAt || null,
      credits,
      status,
      payment_method: paymentMethod,
    });

    if (membershipErr) {
      return NextResponse.json({ error: membershipErr.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      invited: true,
      member,
      redirectTo,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
