import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Este endpoint invita usuarios por email (no crea password).
// El usuario setea su password desde /set-password al abrir el link.
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const fullName = (body.fullName ?? body.name ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim().toLowerCase();
    const role = (body.role ?? "athlete").toString(); // admin | coach | athlete (o lo que uses)
    const phone = (body.phone ?? "").toString().trim();

    if (!fullName) {
      return NextResponse.json({ error: "fullName is required" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const redirectTo =
      `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/set-password`;

    // 1) Invita al usuario por email
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { fullName, role, phone },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // data.user suele venir con el id; si no viniera, igual la invitación fue enviada.
    const userId = (data as any)?.user?.id ?? null;

    // 2) (Opcional pero recomendado) crear/actualizar tu tabla profiles si la tenés
    // Si no existe la tabla, esta parte fallará: podés comentar.
    if (userId) {
      await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            email,
            full_name: fullName,
            role,
            phone,
          },
          { onConflict: "id" }
        );
    }

    return NextResponse.json({
      ok: true,
      invited: true,
      email,
      userId,
      redirectTo,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
