"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";

type WodTipo = "metcon" | "strength" | "skill" | "hero" | "benchmark" | "";
type WodEstado = "draft" | "published" | "";

// importante: esto debe matchear normalizeTrack() del backend
type Track =
  | "crossfit"
  | "functional"
  | "weightlifting"
  | "open_gym"
  | "jiujitsu"
  | "kids"
  | "";

type WodFormValues = {
  date: string;
  track: Track;
  title: string;
  type: WodTipo;
  status: WodEstado;
  workout: string;
  coachNotes: string;
};

export default function AddWodForm({
  wodId,
  initialValues,
  submitLabel = "Create WOD",
}: {
  wodId?: string; // si existe, es EDIT
  initialValues?: Partial<WodFormValues>;
  submitLabel?: string;
}) {
  const router = useRouter();

  const typeOptions = [
    { value: "metcon", label: "Metcon" },
    { value: "strength", label: "Strength" },
    { value: "skill", label: "Skill" },
    { value: "hero", label: "Hero" },
    { value: "benchmark", label: "Benchmark" },
  ];

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
  ];

  const trackOptions = [
    { value: "crossfit", label: "CrossFit" },
    { value: "functional", label: "Functional" },
    { value: "weightlifting", label: "Weightlifting" },
    { value: "open_gym", label: "Open Gym" },
    { value: "jiujitsu", label: "JiuJitsu" },
    { value: "kids", label: "Kids" },
  ];

  const [form, setForm] = useState<WodFormValues>({
    date: "2026-01-01",
    track: "",
    title: "",
    type: "",
    status: "draft",
    workout: "",
    coachNotes: "",
    ...initialValues,
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<null | {
    variant: "success" | "error";
    title: string;
    message: string;
  }>(null);

  const canSubmit = useMemo(() => {
    return !!form.date && !!form.track && !!form.workout.trim() && !!form.status && !saving;
  }, [form, saving]);

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
        track: form.track,
        title: form.title.trim() || "",
        type: form.type || "",
        isPublished: form.status === "published",
        workout: form.workout,
        coachNotes: form.coachNotes || "",
      };

      const method = wodId ? "PATCH" : "POST";
      const finalPayload = wodId ? { id: wodId, ...payload } : payload;

      const res = await fetch("/api/admin/wods", {
        method,
        headers: { "Content-Tipo": "application/json" },
        body: JSON.stringify(finalPayload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = String((data as any)?.error || "Could not save WOD");
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
        message: e?.message || "Could not save WOD",
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
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">Detalles del WOD</h2>
        </div>

        <div className="p-4 sm:p-6 dark:border-gray-800">
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
              <Label>Tipo de clase</Label>
              <Select
                options={trackOptions}
                placeholder="Seleccioná disciplina"
                onChange={(v) => setForm((p) => ({ ...p, track: String(v) as Track }))}
                defaultValue={form.track}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Título</Label>
              <Input
                placeholder="Optional name (Fran, Open 25.1...)"
                value={form.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>

            <div>
              <Label>Tipo</Label>
              <Select
                options={typeOptions}
                placeholder="Select type"
                onChange={(v) => setForm((p) => ({ ...p, type: (String(v) as WodTipo) || "" }))}
                defaultValue={form.type}
              />
            </div>

            <div>
              <Label>Estado</Label>
              <Select
                options={statusOptions}
                placeholder="Select status"
                onChange={(v) => setForm((p) => ({ ...p, status: (String(v) as WodEstado) || "draft" }))}
                defaultValue={form.status}
              />
            </div>

            <div className="md:col-span-2">
              <Label>WOD</Label>
              <TextArea
                rows={10}
                placeholder="Write the WOD..."
                value={form.workout}
                onChange={(value) => setForm((p) => ({ ...p, workout: value }))}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Notas</Label>
              <TextArea
                rows={6}
                placeholder="Scaling, stimulus, notes..."
                value={form.coachNotes}
                onChange={(value) => setForm((p) => ({ ...p, coachNotes: value }))}
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
