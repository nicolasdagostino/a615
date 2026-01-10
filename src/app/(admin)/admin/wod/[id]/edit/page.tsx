"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import AddWodForm from "@/components/wod/AddWodForm";

type ApiWod = {
  id: string;
  wodDate?: string | null;
  wod_date?: string | null;
  track?: string | null;
  title?: string | null;
  type?: string | null;
  workout?: string | null;
  coachNotes?: string | null;
  coach_notes?: string | null;
  isPublished?: boolean | null;
  is_published?: boolean | null;
};

export default function EditWodPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = String(params?.id || "").trim();

  const [loading, setLoading] = useState(true);
  const [wod, setWod] = useState<ApiWod | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!id) {
        setError("Missing WOD id");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/admin/wods?id=${encodeURIComponent(id)}`, {
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(String((data as any)?.error || "Failed to load WOD"));

        const w = (data as any)?.wod as ApiWod | undefined;
        if (!w) throw new Error("WOD not found");

        if (!alive) return;
        setWod(w);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to load WOD");
        setWod(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  const initialValues = useMemo(() => {
    if (!wod) return undefined;

    const date = String(wod.wodDate ?? wod.wod_date ?? "");
    const track = String(wod.track ?? "");
    const title = String(wod.title ?? "");
    const type = String(wod.type ?? "");
    const workout = String(wod.workout ?? "");
    const coachNotes = String(wod.coachNotes ?? wod.coach_notes ?? "");
    const isPublished = !!(wod.isPublished ?? wod.is_published);

    return {
      date,
      track,
      title,
      type: (type as any) || "",
      status: (isPublished ? "published" : "draft") as any,
      workout,
      coachNotes,
    };
  }, [wod]);

  return (
    <ComponentCard title="Edit WOD">
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
          Loading…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">ERROR</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{error}</p>
          <button
            className="mt-4 inline-flex h-10 items-center rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700"
            onClick={() => router.push("/admin/wod")}
          >
            Back to WODs
          </button>
        </div>
      ) : !wod || !initialValues ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
          WOD not found.
        </div>
      ) : (
        <AddWodForm wodId={id} submitLabel="Save Changes" initialValues={initialValues as any} />
      )}
    </ComponentCard>
  );
}
