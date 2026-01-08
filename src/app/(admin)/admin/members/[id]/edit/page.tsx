import ComponentCard from "@/components/common/ComponentCard";
import AddMemberForm from "@/components/members/AddMemberForm";
import { Metadata } from "next";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Edit Member | TailAdmin - Next.js Dashboard Template",
  description: "Edit member page",
};

type MemberFormDefaults = {
  fullName?: string;
  email?: string;
  phone?: string;
  dob?: string;
  notes?: string;

  plan?: string;
  monthlyFee?: string;
  expiresAt?: string;
  credits?: string;
  status?: string;
  paymentMethod?: string;
  startDate?: string;

  role?: "admin" | "coach" | "athlete";
};

async function assertAdmin() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const };
}

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const auth = await assertAdmin();
  if (!auth.ok) {
    // En server component no podemos retornar NextResponse directo de forma estándar,
    // pero evitamos crashear y mostramos algo simple.
    return (
      <div>
        <ComponentCard title="Edit Member">
          <div className="text-sm text-gray-500">Forbidden / Unauthorized</div>
        </ComponentCard>
      </div>
    );
  }

  const admin = createAdminClient();

  // 1) Member + membership
  const { data: one, error: oneErr } = await admin
    .from("members")
    .select(
      `
      id, user_id, full_name, email, phone, dob, notes,
      memberships:memberships ( plan, monthly_fee, start_date, expires_at, credits, status, payment_method )
    `
    )
    .eq("id", id)
    .single();

  if (oneErr || !one) {
    return (
      <div>
        <ComponentCard title="Edit Member">
          <div className="text-sm text-gray-500">
            {oneErr?.message || "Member not found"}
          </div>
        </ComponentCard>
      </div>
    );
  }

  // 2) Role desde profiles (por user_id)
  const uid = String((one as any).user_id || "").trim();
  let role: "admin" | "coach" | "athlete" = "athlete";
  if (uid) {
    const { data: prof } = await admin.from("profiles").select("role").eq("id", uid).single();
    const r = String((prof as any)?.role || "").trim().toLowerCase();
    if (r === "admin" || r === "coach" || r === "athlete") role = r as any;
  }

  const membership = Array.isArray((one as any).memberships)
    ? (one as any).memberships[0]
    : (one as any).memberships || null;

  const defaults: MemberFormDefaults = {
    fullName: String((one as any).full_name || "").trim(),
    email: String((one as any).email || "").trim(),
    phone: String((one as any).phone || "").trim(),
    dob: String((one as any).dob || "").trim(),
    notes: String((one as any).notes || "").trim(),

    role,

    plan: String(membership?.plan || "").trim(),
    monthlyFee:
      membership?.monthly_fee === null || membership?.monthly_fee === undefined
        ? ""
        : String(membership.monthly_fee),
    startDate: String(membership?.start_date || "").trim(),
    expiresAt: String(membership?.expires_at || "").trim(),
    credits:
      membership?.credits === null || membership?.credits === undefined
        ? ""
        : String(membership.credits),
    status: String(membership?.status || "").trim(),
    paymentMethod: String(membership?.payment_method || "").trim(),
  };

  return (
    <div>
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Edit Member">
          <AddMemberForm
            memberId={id}
            defaultValues={defaults}
            primaryButtonLabel="Save Changes"
          />
        </ComponentCard>
      </div>
    </div>
  );
}
