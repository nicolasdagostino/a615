import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ClassDbRow = {
  id: string;
  name: string;
  coach: string;
  type: string;
  day: string;
  time: string;
  duration_min: number;
  capacity: number;
  status: string;
  notes: string | null;
};

function toTitle(s: string) {
  const v = (s || "").trim();
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : "";
}

function mapCoachToUi(v: string): string {
  const s = (v || "").trim().toLowerCase();
  if (s === "nico") return "Nico";
  if (s === "laura") return "Laura";
  if (s === "pablo") return "Pablo";
  return toTitle(s);
}

function mapTypeToUi(v: string): "CrossFit" | "Open Box" | "Weightlifting" | "Gymnastics" | string {
  const s = (v || "").trim().toLowerCase();
  if (s === "crossfit") return "CrossFit";
  if (s === "open-box") return "Open Box";
  if (s === "weightlifting") return "Weightlifting";
  if (s === "gymnastics") return "Gymnastics";
  return toTitle(s);
}

function mapDayToUi(v: string): string {
  const s = (v || "").trim().toLowerCase();
  if (s === "mon") return "Mon";
  if (s === "tue") return "Tue";
  if (s === "wed") return "Wed";
  if (s === "thu") return "Thu";
  if (s === "fri") return "Fri";
  if (s === "sat") return "Sat";
  if (s === "sun") return "Sun";
  return toTitle(s);
}

function mapStatusToUi(v: string): "Scheduled" | "Full" | "Cancelled" {
  const s = (v || "").trim().toLowerCase();
  if (s === "scheduled") return "Scheduled";
  if (s === "full") return "Full";
  if (s === "cancelled") return "Cancelled";
  return "Scheduled";
}

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

  return { ok: true as const, userId: user.id };
}

/**
 * GET /api/admin/classes
 * - list: { ok: true, classes: [...] }
 * - detail: ?id=... -> { ok: true, class: {...} }
 */
export async function GET(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const admin = createAdminClient();
    const url = new URL(req.url);
    const idParam = String(url.searchParams.get("id") || "").trim();

    if (idParam) {
      const { data: one, error: oneErr } = await admin
        .from("classes")
        .select("id, name, coach, type, day, time, duration_min, capacity, status, notes")
        .eq("id", idParam)
        .single();

      if (oneErr) return NextResponse.json({ error: oneErr.message }, { status: 400 });
      if (!one) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const c = one as any as ClassDbRow;

      return NextResponse.json({
        ok: true,
        class: {
          id: String(c.id),
          name: String(c.name || ""),
          coach: String(c.coach || ""),
          type: String(c.type || ""),
          day: String(c.day || ""),
          time: String(c.time || ""),
          durationMin: c.duration_min === null || c.duration_min === undefined ? "" : String(c.duration_min),
          capacity: c.capacity === null || c.capacity === undefined ? "" : String(c.capacity),
          status: String(c.status || ""),
          notes: (c.notes || "") as string,
        },
      });
    }

    const { data, error } = await admin
      .from("classes")
      .select("id, name, coach, type, day, time, duration_min, capacity, status, notes")
      .order("day", { ascending: true })
      .order("time", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const rows = (data || []).map((r: any) => {
      const c = r as ClassDbRow;
      return {
        id: String(c.id),
        name: String(c.name || ""),
        coach: mapCoachToUi(String(c.coach || "")),
        day: mapDayToUi(String(c.day || "")),
        time: String(c.time || ""),
        durationMin: Number(c.duration_min ?? 0),
        capacity: Number(c.capacity ?? 0),
        type: mapTypeToUi(String(c.type || "")),
        status: mapStatusToUi(String(c.status || "")),
      };
    });

    return NextResponse.json({ ok: true, classes: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/classes
 * body: { name, coach, type, day, time, durationMin, capacity, status, notes }
 */
export async function POST(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json().catch(() => ({} as any));

    const name = String(body.name || "").trim();
    const coach = String(body.coach || "").trim().toLowerCase();
    const type = String(body.type || "").trim().toLowerCase();
    const day = String(body.day || "").trim().toLowerCase();
    const time = String(body.time || "").trim();
    const status = String(body.status || "").trim().toLowerCase();
    const notes = String(body.notes || "").trim() || null;

    const durationRaw = String(body.durationMin || "").trim();
    const capacityRaw = String(body.capacity || "").trim();
    const durationMin = durationRaw ? Number(durationRaw) : 0;
    const capacity = capacityRaw ? Number(capacityRaw) : 0;

    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    if (!coach) return NextResponse.json({ error: "coach is required" }, { status: 400 });
    if (!type) return NextResponse.json({ error: "type is required" }, { status: 400 });
    if (!day) return NextResponse.json({ error: "day is required" }, { status: 400 });
    if (!time) return NextResponse.json({ error: "time is required" }, { status: 400 });
    if (!status) return NextResponse.json({ error: "status is required" }, { status: 400 });

    if (Number.isNaN(durationMin) || durationMin <= 0) return NextResponse.json({ error: "Invalid durationMin" }, { status: 400 });
    if (Number.isNaN(capacity) || capacity <= 0) return NextResponse.json({ error: "Invalid capacity" }, { status: 400 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("classes")
      .insert({
        name,
        coach,
        type,
        day,
        time,
        duration_min: durationMin,
        capacity,
        status,
        notes,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, id: String((data as any)?.id || "") });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/classes
 * body: { id, name, coach, type, day, time, durationMin, capacity, status, notes }
 */
export async function PATCH(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json().catch(() => ({} as any));
    const id = String(body.id || "").trim();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const name = String(body.name || "").trim();
    const coach = String(body.coach || "").trim().toLowerCase();
    const type = String(body.type || "").trim().toLowerCase();
    const day = String(body.day || "").trim().toLowerCase();
    const time = String(body.time || "").trim();
    const status = String(body.status || "").trim().toLowerCase();
    const notes = String(body.notes || "").trim() || null;

    const durationRaw = String(body.durationMin || "").trim();
    const capacityRaw = String(body.capacity || "").trim();
    const durationMin = durationRaw ? Number(durationRaw) : 0;
    const capacity = capacityRaw ? Number(capacityRaw) : 0;

    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    if (!coach) return NextResponse.json({ error: "coach is required" }, { status: 400 });
    if (!type) return NextResponse.json({ error: "type is required" }, { status: 400 });
    if (!day) return NextResponse.json({ error: "day is required" }, { status: 400 });
    if (!time) return NextResponse.json({ error: "time is required" }, { status: 400 });
    if (!status) return NextResponse.json({ error: "status is required" }, { status: 400 });

    if (Number.isNaN(durationMin) || durationMin <= 0) return NextResponse.json({ error: "Invalid durationMin" }, { status: 400 });
    if (Number.isNaN(capacity) || capacity <= 0) return NextResponse.json({ error: "Invalid capacity" }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin
      .from("classes")
      .update({
        name,
        coach,
        type,
        day,
        time,
        duration_min: durationMin,
        capacity,
        status,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/classes?id=...
 */
export async function DELETE(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const url = new URL(req.url);
    const id = String(url.searchParams.get("id") || "").trim();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin.from("classes").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
