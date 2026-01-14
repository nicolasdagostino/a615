import { NextResponse } from "next/server";

/**
 * Legacy endpoint.
 * Canon: GET /api/athlete/history?month=YYYY-MM
 * This route redirects to the canon one to avoid breaking old clients.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const days = url.searchParams.get("days");

  // Old clients might call ?date=YYYY-MM-DD&days=31; best-effort map to month=YYYY-MM
  let month = url.searchParams.get("month");
  if (!month && date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    month = date.slice(0, 7);
  }

  const target = new URL("/api/athlete/history", url.origin);
  if (month) target.searchParams.set("month", month);
  if (days) target.searchParams.set("days", days);
  if (date && !month) target.searchParams.set("date", date);

  return NextResponse.redirect(target, 307);
}
