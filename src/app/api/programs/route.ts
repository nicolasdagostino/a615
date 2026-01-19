import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/programs
 * Public: lista programas para dropdowns (athlete).
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("programs")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const programs = (data || []).map((p: any) => ({
      id: String(p.id),
      name: String(p.name || ""),
    }));

    return NextResponse.json({ ok: true, programs });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
