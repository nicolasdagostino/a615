import { NextResponse } from "next/server";

function isoTodayUTC() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/**
 * GET /api/athlete/today?date=YYYY-MM-DD
 * Devuelve lo mismo que /api/athlete/sessions pero con days=1.
 * (Para evitar duplicar lógica, hace fetch interno al endpoint de sessions.)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const date = String(url.searchParams.get("date") || "").trim() || isoTodayUTC();

    // Ojo: esto funciona server-side porque es mismo host.
    const base = `${url.protocol}//${url.host}`;

    const res = await fetch(`${base}/api/athlete/sessions?date=${encodeURIComponent(date)}&days=1`, {
      method: "GET",
      headers: {
        // pasa cookies para auth
        cookie: req.headers.get("cookie") || "",
      },
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
