import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import SignInForm from "@/components/auth/SignInForm";
import { createServerClient } from "@supabase/ssr";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function SignInPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") {
      redirect("/admin/dashboard");
    }

    if (profile?.role === "coach") {
      redirect("/coach/dashboard");
    }

    if (profile?.role === "athlete") {
      redirect("/athlete/home");
    }
  }

  return <SignInForm />;
}
