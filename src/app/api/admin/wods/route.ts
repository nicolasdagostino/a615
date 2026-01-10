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
  if ((profile as any)?.role !== "admin") {
    return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const, userId: user.id };
}

function normalizeTrack(track: string) {
  const t = String(track || "").trim().toLowerCase();
  // agregá acá lo que uses en tu gym
  const allowed = new Set(["crossfit", "functional", "weightlifting", "open_gym", "jiujitsu", "kids"]);
  if (!allowed.has(t)) return null;
  return t;
}

function normalizeDate(d: string) {
  const v = String(d || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  return v;
}

function normalizeType(v: any) {
  const t = String(v ?? "").trim().toLowerCase();
  const allowed = new Set(["", "metcon", "strength", "skill", "hero", "benchmark"]);
  if (!allowed.has(t)) return "";
  return t;
}

function toUi(row: any) {
  return {
    id: String(row.id),
    wodDate: String(row.wod_date || ""),
    track: String(row.track || ""),
    title: row.title ?? "",
    type: String(row.type ?? ""),
    workout: String(row.workout || ""),
    coachNotes: row.coach_notes ?? "",
    isPublished: !!row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const admin = createAdminClient();
    const url = new URL(req.url);

    const id = String(url.searchParams.get("id") || "").trim();
    const date = String(url.searchParams.get("date") || "").trim();
    const month = String(url.searchParams.get("month") || "").trim(); // YYYY-MM
    const track = String(url.searchParams.get("track") || "").trim();

    if (id) {
      const { data, error } = await admin
        .from("wods")
        .select("id, wod_date, track, title, type, workout, coach_notes, is_published, created_at, updated_at")
        .eq("id", id)
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

      return NextResponse.json({ ok: true, wod: toUi(data) });
    }

    let query = admin
      .from("wods")
      .select("id, wod_date, track, title, type, workout, coach_notes, is_published, created_at, updated_at")
      .order("wod_date", { ascending: false })
      .order("track", { ascending: true });

    if (date) {
      const nd = normalizeDate(date);
      if (!nd) return NextResponse.json({ error: "Invalid date (expected YYYY-MM-DD)" }, { status: 400 });
      query = query.eq("wod_date", nd);
    } else if (month) {
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json({ error: "Invalid month (expected YYYY-MM)" }, { status: 400 });
      }
      const start = `${month}-01`;
      const [y, m] = month.split("-").map((x) => Number(x));
      const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
      const endExclusive = `${nextMonth}-01`;
      query = query.gte("wod_date", start).lt("wod_date", endExclusive);
    }

    if (track) {
      const nt = normalizeTrack(track);
      if (!nt) return NextResponse.json({ error: "Invalid track" }, { status: 400 });
      query = query.eq("track", nt);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, wods: (data || []).map(toUi) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json().catch(() => ({} as any));

    const wodDate = normalizeDate(body.wodDate || body.wod_date);
    const track = normalizeTrack(body.track);
    const title = String(body.title || "").trim() || null;
    const workout = String(body.workout || "").trim();
    const coachNotes = String(body.coachNotes || body.coach_notes || "").trim() || null;
    const isPublished = !!body.isPublished || !!body.is_published;
    const type = normalizeType(body.type);

    if (!wodDate) return NextResponse.json({ error: "wodDate is required (YYYY-MM-DD)" }, { status: 400 });
    if (!track) return NextResponse.json({ error: "track is required" }, { status: 400 });
    if (!workout) return NextResponse.json({ error: "workout is required" }, { status: 400 });

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("wods")
      .insert({
        wod_date: wodDate,
        track,
        title,
        type,
        workout,
        coach_notes: coachNotes,
        is_published: isPublished,
        created_by: auth.userId,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, id: String((data as any)?.id || "") });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json().catch(() => ({} as any));
    const id = String(body.id || "").trim();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const patch: any = {};

    if (body.wodDate !== undefined || body.wod_date !== undefined) {
      const nd = normalizeDate(body.wodDate ?? body.wod_date);
      if (!nd) return NextResponse.json({ error: "Invalid wodDate (YYYY-MM-DD)" }, { status: 400 });
      patch.wod_date = nd;
    }

    if (body.track !== undefined) {
      const nt = normalizeTrack(body.track);
      if (!nt) return NextResponse.json({ error: "Invalid track" }, { status: 400 });
      patch.track = nt;
    }

    if (body.title !== undefined) patch.title = String(body.title || "").trim() || null;

    if (body.type !== undefined) patch.type = normalizeType(body.type);

    if (body.workout !== undefined) {
      const w = String(body.workout || "").trim();
      if (!w) return NextResponse.json({ error: "workout cannot be empty" }, { status: 400 });
      patch.workout = w;
    }

    if (body.coachNotes !== undefined || body.coach_notes !== undefined) {
      patch.coach_notes = String(body.coachNotes ?? body.coach_notes ?? "").trim() || null;
    }

    if (body.isPublished !== undefined || body.is_published !== undefined) {
      patch.is_published = !!(body.isPublished ?? body.is_published);
    }

    const admin = createAdminClient();
    const { error } = await admin.from("wods").update(patch).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const url = new URL(req.url);
    const id = String(url.searchParams.get("id") || "").trim();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin.from("wods").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
