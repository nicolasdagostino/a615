import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

function dayKeyFromDateMadrid(d: Date): DayKey {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Europe/Madrid",
  })
    .format(d)
    .toLowerCase();

  return weekday as DayKey;
}

function isoDateMadrid(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const dd = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${dd}`;
}

function addDaysUTC(dateISO: string, days: number) {
  // dateISO YYYY-MM-DD -> sum in UTC to avoid TZ issues
  const d = new Date(`${dateISO}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return isoDateMadrid(d);
}

async function fetchClassesForDay(admin: any, day: DayKey) {
  const { data, error } = await admin
    .from("classes")
    .select("id, name, coach, type, day, time, duration_min, capacity, status, notes")
    .eq("day", day)
    .in("status", ["scheduled", "full"])
    .order("time", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as any[];
}

/**
 * GET /api/athlete/today
 * Optional:
 *  - ?date=YYYY-MM-DD (para testing)
 *  - ?fallback=next (si lo pasas, hace fallback; si no lo pasas, también lo hace por defecto)
 *
 * Devuelve:
 *  - date/day (la fecha elegida)
 *  - mode: "today" | "next"
 *  - offsetDays: 0..7
 *  - classes con wod pegado por track/type
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const dateParam = String(url.searchParams.get("date") || "").trim();

    // fecha base: param o hoy Madrid
    const baseDateISO = dateParam || isoDateMadrid(new Date());

    const admin = createAdminClient();

    let chosenDateISO = baseDateISO;
    let chosenDay: DayKey = dayKeyFromDateMadrid(new Date(`${baseDateISO}T12:00:00.000Z`));
    let classRows: any[] = [];

    // Fallback: buscar el próximo día con clases (hasta 7 días)
    let offsetDays = 0;
    for (let i = 0; i <= 7; i++) {
      const dISO = addDaysUTC(baseDateISO, i);
      const dDay = dayKeyFromDateMadrid(new Date(`${dISO}T12:00:00.000Z`));
      const rows = await fetchClassesForDay(admin, dDay);
      if (rows.length) {
        chosenDateISO = dISO;
        chosenDay = dDay;
        classRows = rows;
        offsetDays = i;
        break;
      }
      if (i === 0) {
        // si hoy no hay, seguimos
      }
    }

    // Types presentes en esas clases
    const types = Array.from(
      new Set(classRows.map((c) => String(c.type || "").toLowerCase()).filter(Boolean))
    );

    // Buscar WODs publicados de la fecha elegida, por esos tracks
    let wodsByTrack: Record<string, any> = {};
    if (types.length) {
      const { data: wods, error: wErr } = await admin
        .from("wods")
        .select("id, wod_date, track, title, workout, coach_notes, is_published")
        .eq("wod_date", chosenDateISO)
        .eq("is_published", true)
        .in("track", types);

      if (wErr) return NextResponse.json({ error: wErr.message }, { status: 400 });

      wodsByTrack = Object.fromEntries(
        (wods || []).map((w: any) => [String(w.track).toLowerCase(), w])
      );
    }

    const merged = classRows.map((c) => {
      const type = String(c.type || "").toLowerCase();
      const wod = wodsByTrack[type] || null;

      return {
        id: String(c.id),
        name: String(c.name || ""),
        coach: String(c.coach || ""),
        type,
        day: String(c.day || ""),
        time: String(c.time || ""),
        status: String(c.status || ""),
        durationMin: Number(c.duration_min ?? 0),
        capacity: Number(c.capacity ?? 0),
        notes: c.notes ?? null,
        wod: wod
          ? {
              id: String(wod.id),
              wodDate: String(wod.wod_date),
              track: String(wod.track),
              title: wod.title ?? null,
              coachNotes: wod.coach_notes ?? null,
            }
          : null,
      };
    });

    return NextResponse.json({
      ok: true,
      mode: offsetDays === 0 ? "today" : "next",
      offsetDays,
      baseDate: baseDateISO,
      date: chosenDateISO,
      day: chosenDay,
      classes: merged,
      missingWodTypes: types.filter((t) => !wodsByTrack[t]),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
