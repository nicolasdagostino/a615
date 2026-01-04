"use client";

import { useEffect, useMemo, useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Link from "next/link";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { createClient } from "@/lib/supabase/client";

function parseHashParams(hash: string) {
  // hash viene como "#access_token=...&refresh_token=...&type=invite"
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(h);
  return {
    access_token: params.get("access_token"),
    refresh_token: params.get("refresh_token"),
    type: params.get("type"),
    error: params.get("error"),
    error_description: params.get("error_description"),
  };
}

export default function SetPasswordForm() {
  const supabase = useMemo(() => createClient(), []);

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setMessage(null);
      setReady(false);

      // 1) Si venimos de invite, Supabase suele mandar tokens en el hash
      if (typeof window !== "undefined" && window.location.hash) {
        const { access_token, refresh_token, error, error_description } =
          parseHashParams(window.location.hash);

        if (error) {
          setMessage(error_description || error);
          return;
        }

        if (access_token && refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (setErr) {
            setMessage(
              `No se pudo establecer sesión desde el link (setSession): ${setErr.message}. Volvé a abrir el link del email.`
            );
            return;
          }

          // Limpia el hash para que no quede el token en la URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

      // 2) Verificamos si ya hay sesión
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setMessage(
          "No active session found. Please open the invitation link from your email again."
        );
        return;
      }

      setReady(true);
    })();
  }, [supabase]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!password || password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Password set successfully. You can now sign in.");
      window.location.href = "/signin";
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to Sign In
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Set Password
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create your password to access the app.
          </p>
        </div>

        {message ? (
          <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
            {message}
          </div>
        ) : null}

        <form onSubmit={onSubmit}>
          <div className="space-y-6">
            <div>
              <Label>
                New Password <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter a new password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  disabled={!ready || loading}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                  )}
                </span>
              </div>
            </div>

            <div>
              <Button className="w-full" size="sm" disabled={!ready || loading}>
                {loading ? "Saving..." : "Save password"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
