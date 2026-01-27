import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/athlete/profile
 * Athlete profile + current membership
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    /* ---------------- Profile (auth user) ---------------- */
    const { data: profile, error: pErr } = await admin
      .from("profiles")
      .select("id, full_name, email, phone, role")
      .eq("id", user.id)
      .single();

    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 400 });
    }

    /* ---------------- Member (athlete record) ---------------- */
    const { data: member, error: mErr } = await admin
      .from("members")
      .select("id, dob, notes")
      .eq("user_id", user.id)
      .single();

    if (mErr && mErr.code !== "PGRST116") {
      return NextResponse.json({ error: mErr.message }, { status: 400 });
    }

    let membership: any = null;

    if (member?.id) {
      const { data: ms, error: msErr } = await admin
        .from("memberships")
        .select(
          "id, plan, status, start_date, expires_at, credits, monthly_fee, payment_method"
        )
        .eq("member_id", member.id)
        .order("status", { ascending: false }) // active first
        .order("start_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1);

      if (msErr) {
        return NextResponse.json({ error: msErr.message }, { status: 400 });
      }

      membership = ms?.[0] ?? null;
    }

    const fullName = String(profile.full_name || "").trim();
    const [firstName, ...rest] = fullName.split(" ");
    const lastName = rest.join(" ");

    return NextResponse.json({
      ok: true,
      profile: {
        userId: user.id,
        fullName,
        firstName: firstName || "",
        lastName: lastName || "",
        email: profile.email,
        phone: profile.phone,
        birthdate: member?.dob ?? null,
        role: profile.role,
      },
      membership: membership
        ? {
            plan: membership.plan,
            status: membership.status,
            startDate: membership.start_date,
            expiresAt: membership.expires_at,
            credits: membership.credits,
            monthlyFee: membership.monthly_fee,
            paymentMethod: membership.payment_method,
          }
        : null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
