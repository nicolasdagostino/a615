"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";

type WodEstado = "draft" | "published";

type ProgramOption = { value: string; label: string };

type WodFormValues = {
  date: string;
  programId: string;
  status: WodEstado;
  workout: string;
};

export default function AddWodForm({
  wodId,
  initialValues,
  submitLabel = "Save",
}: {
  wodId?: string; // si existe, es EDIT
  initialValues?: Partial<WodFormValues>;
  submitLabel?: string;
}) {
  const router = useRouter();

  const [programOptions, setProgramOptions] = useState<ProgramOption[]>([]);

  const [form, setForm] = useState<WodFormValues>({
    date: initialValues?.date || "2026-01-01",
    programId: initialValues?.programId || "",
    status: (initialValues?.status as WodEstado) || "draft",
    workout: initialValues?.workout || "",
  });

  // si cambia initialValues (edit), sync
  useEffect(() => {
    if (!initialValues) return;
    setForm((p) => ({
      ...p,
      date: initialValues.date ?? p.date,
      programId: initialValues.programId ?? p.programId,
      status: (initialValues.status as WodEstado) ?? p.status,
      workout: initialValues.workout ?? p.workout,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialValues || {})]);

  // cargar programs
  useEffect(() => {
    async function loadPrograms() {
      try {
        const res = await fetch("/api/admin/programs", { method: "GET" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;

        const rows = Array.isArray(data?.programs) ? data.programs : [];
        const opts = rows
          .map((p: any) => ({ value: String(p.id || "").trim(), label: String(p.name || "").trim() }))
          .filter((o: any) => o.value && o.label)
          .sort((a: any, b: any) => a.label.localeCompare(b.label));

        setProgramOptions(opts);
      } catch {}
    }
    loadPrograms();
  }, []);

  // si el programId actual no existe en options, lo agregamos (caso edit / race)
  const resolvedPrograms = useMemo(() => {
    const cur = String(form.programId || "").trim();
    if (!cur) return programOptions;
    const exists = programOptions.some((o) => o.value === cur);
    return exists ? programOptions : [{ value: cur, label: cur }, ...programOptions];
  }, [programOptions, form.programId]);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<null | { variant: "success" | "error"; title: string; message: string }>(null);

  const canSubmit = useMemo(() => {
    return !!form.date && !!form.programId && !!form.workout.trim() && !saving;
  }, [form.date, form.programId, form.workout, saving]);

  const handleCancel = () => {
    router.push("/admin/wod");
    router.refresh();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSaving(true);
    setFeedback(null);

    try {
      const payload: any = {
        wodDate: form.date,
        programId: form.programId,
        workout: form.workout,
        isPublished: form.status === "published",
      };

      const method = wodId ? "PATCH" : "POST";
      const finalPayload = wodId ? { id: wodId, ...payload } : payload;

      const res = await fetch("/api/admin/wods", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = String((data as any)?.error || "Failed to save");
        throw new Error(msg);
      }

      setFeedback({
        variant: "success",
        title: "Saved",
        message: wodId ? "WOD updated successfully." : "WOD created successfully.",
      });

      router.push("/admin/wod");
      router.refresh();
    } catch (e: any) {
      setFeedback({
        variant: "error",
        title: "Could not save WOD",
        message: e?.message || "Failed to save",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {feedback ? <Alert variant={feedback.variant} title={feedback.title} message={feedback.message} /> : null}

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">WOD</h2>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>

            <div>
              <Label>Program</Label>
              <select
                value={form.programId}
                onChange={(e) => setForm((p) => ({ ...p, programId: e.target.value }))}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  Select program
                </option>
                {resolvedPrograms.map((p) => (
                  <option key={p.value} value={p.value} className="text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <Label>Status</Label>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as WodEstado }))}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="draft" className="text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                  Draft
                </option>
                <option value="published" className="text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                  Published
                </option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Label>Workout</Label>
              <TextArea
                rows={10}
                placeholder="Write the WOD (or 'Rest day')..."
                value={form.workout}
                onChange={(value) => setForm((p) => ({ ...p, workout: String(value) }))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
          {saving ? "Saving..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
