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

  // 1) Esto dispara el refresh automático si el access_token expiró (si hay refresh token)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A615_FORCE_PASSWORD_CHANGE_V2
  // ✅ Force password change on first login (admin-created accounts)
  // Uses user_metadata.must_change_password
  const { data: __a615_userData } = await supabase.auth.getUser();
  const __a615_user = __a615_userData?.user;

  const __a615_mustChange =
    !!(__a615_user as any)?.user_metadata?.must_change_password;

  const __a615_path = request.nextUrl.pathname;

  const __a615_allow =
    __a615_path.startsWith("/set-password") ||
    __a615_path.startsWith("/signin") ||
    __a615_path.startsWith("/signup") ||
    __a615_path.startsWith("/reset-password") ||
    __a615_path.startsWith("/two-step-verification") ||
    __a615_path.startsWith("/api");

  if (__a615_user && __a615_mustChange && !__a615_allow) {
    const url = request.nextUrl.clone();
    url.pathname = "/set-password";
    return NextResponse.redirect(url);
  }


  // 2) No logueado => /signin
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // 3) Perfil/rol (hardening: si no hay rol, hacemos signOut y mandamos a /signin)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.role) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  const role = profile.role as Role;

  // 4) Autorización por rol
  const allowed =
    (required === "admin" && role === "admin") ||
    (required === "coach" && (role === "coach" || role === "admin")) ||
    (required === "athlete" && (role === "athlete" || role === "admin"));

  if (!allowed) {
    return NextResponse.redirect(new URL(homeForRole(role), request.url));
  }

  // Importantísimo: devolver "response" para que salgan cookies actualizadas si hubo refresh
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/coach/:path*", "/athlete/:path*"],
};
