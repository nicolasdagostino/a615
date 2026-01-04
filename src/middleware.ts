import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

type Role = "admin" | "coach" | "athlete";

function requiredRoleForPath(pathname: string): Role | null {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/coach")) return "coach";
  if (pathname.startsWith("/athlete")) return "athlete";
  return null;
}

function homeForRole(role: Role) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "coach") return "/coach/dashboard";
  return "/athlete/home";
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);
  const { pathname } = request.nextUrl;

  const required = requiredRoleForPath(pathname);
  if (!required) return response;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile?.role) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  const role = profile.role as Role;

  const allowed =
    (required === "admin" && role === "admin") ||
    (required === "coach" && (role === "coach" || role === "admin")) ||
    (required === "athlete" && (role === "athlete" || role === "admin"));

  if (!allowed) {
    return NextResponse.redirect(new URL(homeForRole(role), request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/coach/:path*", "/athlete/:path*"],
};
