import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type MemberRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  dob: string | null;
  notes: string | null;
};

type MembershipRow = {
  member_id: string;
  plan: string | null;
  monthly_fee: number | null;
  start_date: string | null;
  expires_at: string | null;
  credits: number | null;
  status: string | null;
  payment_method: string | null;
};

function mapStatusToUi(status: string | null): "Activa" | "Por vencer" | "Vencida" {
  const s = (status || "").toLowerCase().trim();

  // Aceptamos varios formatos para no romper datos existentes
  if (s === "active" || s === "activa") return "Activa";
  if (s === "expiring" || s === "por vencer" || s === "porvencer") return "Por vencer";
  if (s === "expired" || s === "vencida") return "Vencida";

  // fallback
  return "Activa";
}

function formatFee(monthlyFee: number | null): string {
  if (monthlyFee === null || Number.isNaN(monthlyFee)) return "—";
  // mantenemos simple para no tocar estética: string tipo "79"
  // si querés "€79" lo hacemos después en front sin tocar layout.
  return String(monthlyFee);
}

async function assertAdmin() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const, userId: user.id };
}

/**
 * GET /api/admin/members
 * Devuelve data en el shape que tu MembersTable ya usa:
 * { id, user: { name, email }, plan, fee, expiresAt, status }
 */
export async function GET(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const admin = createAdminClient();

      // Si viene ?id=..., devolvemos detalle para la pantalla Edit
      const url = new URL(req.url);
      const idParam = String(url.searchParams.get("id") || "").trim();

      if (idParam) {
        const { data: one, error: oneErr } = await admin
          .from("members")
          .select(
            `
              id, full_name, email, phone, dob, notes,
              memberships:memberships ( plan, monthly_fee, start_date, expires_at, credits, status, payment_method )
            `
          )
          .eq("id", idParam)
          .single();

        if (oneErr) return NextResponse.json({ error: oneErr.message }, { status: 400 });
        if (!one) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const membership = Array.isArray((one as any).memberships)
          ? (one as any).memberships[0]
          : (one as any).memberships || null;

        return NextResponse.json({
          ok: true,
          member: {
            id: String((one as any).id),
            fullName: ((one as any).full_name || "").trim(),
            email: ((one as any).email || "").trim(),
            phone: ((one as any).phone || "").trim(),
            dob: ((one as any).dob || "").trim(),
            notes: ((one as any).notes || "").trim(),

            plan: (membership?.plan || "").trim(),
            monthlyFee:
              membership?.monthly_fee === null || membership?.monthly_fee === undefined
                ? ""
                : String(membership.monthly_fee),
            startDate: (membership?.start_date || "").trim(),
            expiresAt: (membership?.expires_at || "").trim(),
            credits:
              membership?.credits === null || membership?.credits === undefined
                ? ""
                : String(membership.credits),
            status: (membership?.status || "").trim(),
            paymentMethod: (membership?.payment_method || "").trim(),
          },
        });
      }


    
      // Traemos members + membership
      // Importante: incluimos user_id para poder filtrar por profiles.role = 'athlete'
      const { data, error } = await admin
        .from("members")
        .select(
          `
            id, user_id, full_name, email, phone, dob, notes,
            memberships:memberships ( plan, monthly_fee, start_date, expires_at, credits, status, payment_method )
          `
        )
        .order("full_name", { ascending: true });

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      const members = (data || []) as any[];

      // Filtramos SOLO athletes (role en profiles)
      const userIds = Array.from(
        new Set(members.map((m) => m.user_id).filter(Boolean).map((id) => String(id)))
      );

      let rolesById: Record<string, string> = {};
      if (userIds.length) {
        const { data: profs, error: pErr } = await admin
          .from("profiles")
          .select("id, role")
          .in("id", userIds);

        if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 });

        rolesById = Object.fromEntries(
          (profs || []).map((p: any) => [String(p.id), String(p.role || "").trim()])
        );
      }

      // Excluimos rows sin user_id para evitar "personas sin rol"
      const filtered = members.filter((m) => {
        const uid = m.user_id ? String(m.user_id) : "";
        if (!uid) return false;
        return rolesById[uid] === "athlete";
      });

      const rows = filtered.map((m: any) => {
        const membership = Array.isArray(m.memberships) ? m.memberships[0] : m.memberships || null;

        return {
          id: String(m.id),
          user: {
            name: (m.full_name || "—") as string,
            email: (m.email || "—") as string,
          },
          plan: (membership?.plan || "—") as string,
          fee: formatFee(membership?.monthly_fee ?? null),
          expiresAt: (membership?.expires_at || "—") as string,
          status: mapStatusToUi(membership?.status ?? null),
        };
      });
return NextResponse.json({ ok: true, members: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/members
 * body: { id, fullName, email, phone, dob, notes, plan, monthlyFee, startDate, expiresAt, credits, status, paymentMethod }
 */
export async function PATCH(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json().catch(() => ({}));

    const id = String(body.id || "").trim();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const fullName = String(body.fullName || "").trim() || null;
    const email = String(body.email || "").trim().toLowerCase() || null;
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

    if (monthlyFee !== null && Number.isNaN(monthlyFee)) return NextResponse.json({ error: "Invalid monthly fee" }, { status: 400 });
    if (credits !== null && Number.isNaN(credits)) return NextResponse.json({ error: "Invalid credits" }, { status: 400 });

    const admin = createAdminClient();

    // 1) update members
    const { error: mErr } = await admin
      .from("members")
      .update({
        full_name: fullName,
        email,
        phone,
        dob,
        notes,
      })
      .eq("id", id);

    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 400 });

    // 2) upsert membership
    const { error: msErr } = await admin.from("memberships").upsert(
      {
        member_id: id,
        plan,
        monthly_fee: monthlyFee,
        start_date: startDate,
        expires_at: expiresAt,
        credits,
        status,
        payment_method: paymentMethod,
      },
      { onConflict: "member_id" }
    );

    if (msErr) return NextResponse.json({ error: msErr.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/members?id=...
 * Por ahora hard delete: borra memberships y luego member.
 * Si preferís baja lógica, lo cambiamos cuando me digas qué columnas tenés.
 */
export async function DELETE(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const url = new URL(req.url);
    const id = String(url.searchParams.get("id") || "").trim();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const admin = createAdminClient();

    // Primero memberships (FK)
    const { error: delMsErr } = await admin.from("memberships").delete().eq("member_id", id);
    if (delMsErr) return NextResponse.json({ error: delMsErr.message }, { status: 400 });

    const { error: delMemberErr } = await admin.from("members").delete().eq("id", id);
    if (delMemberErr) return NextResponse.json({ error: delMemberErr.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

/**
 * POST se mantiene con tu lógica de invite + members + memberships.
 * (No lo toco salvo que me pidas cambiar el flujo de invitaciones.)
 */
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
