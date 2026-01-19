"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";

export type ProgramFormDefaults = {
  id?: string;
  name?: string;
};

function normalizeDefaults(d?: ProgramFormDefaults) {
  return {
    id: d?.id ?? "",
    name: d?.name ?? "",
  };
}

export default function AddProgramForm({
  defaultValues,
  primaryButtonLabel = "Save Program",
}: {
  defaultValues?: ProgramFormDefaults;
  primaryButtonLabel?: string;
}) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();

  const programIdFromRoute = String((params as any)?.id || "").trim();
  const isEdit = Boolean(programIdFromRoute);

  const initial = useMemo(() => normalizeDefaults(defaultValues), [defaultValues]);
  const [form, setForm] = useState(initial);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<null | {
    variant: "success" | "error";
    title: string;
    message: string;
  }>(null);

  useEffect(() => {
    setForm(normalizeDefaults(defaultValues));
  }, [defaultValues]);

  const canSubmit = useMemo(() => {
    return !!form.name.trim() && !saving;
  }, [form.name, saving]);

  const handleCancel = () => {
    router.push("/admin/programs");
    router.refresh();
  };

  const handleSave = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setFeedback(null);

    try {
      const payload: any = {
        name: String(form.name || "").trim(),
      };

      const method = isEdit ? "PATCH" : "POST";
      const finalPayload = isEdit
        ? { id: programIdFromRoute || form.id, ...payload }
        : payload;

      const res = await fetch("/api/admin/programs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to save");

      setFeedback({
        variant: "success",
        title: "Saved",
        message: isEdit ? "Program updated successfully." : "Program created successfully.",
      });

      router.push("/admin/programs");
      router.refresh();
    } catch (e: any) {
      setFeedback({
        variant: "error",
        title: "Could not save Program",
        message: e?.message || "Could not save Program",
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
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            Program Details
          </h2>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Program Name</Label>
              <Input
                placeholder="Pay The Man"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={!canSubmit}>
          {saving ? "Saving..." : primaryButtonLabel}
        </Button>
      </div>
    </div>
  );
}
