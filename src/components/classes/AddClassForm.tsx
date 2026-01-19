"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";

export type ClassFormDefaults = {
  id?: string;
  programId?: string;
  coachId?: string;
  day?: string;  // mon..sun
  time?: string; // HH:MM
  durationMin?: string; // "60"
  capacity?: string;    // "12"
  status?: string;      // scheduled | cancelled
};

type Props = {
  defaultValues?: ClassFormDefaults;
  primaryButtonLabel?: string;
};

function normalizeDefaults(d?: ClassFormDefaults): Required<ClassFormDefaults> {
  return {
    id: d?.id ?? "",
    programId: d?.programId ?? "",
    coachId: d?.coachId ?? "",
    day: d?.day ?? "",
    time: d?.time ?? "",
    durationMin: d?.durationMin ?? "",
    capacity: d?.capacity ?? "",
    status: d?.status ?? "scheduled",
  };
}

export default function AddClassForm({
  defaultValues,
  primaryButtonLabel = "Save Class",
}: Props) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const classIdFromRoute = String((params as any)?.id || "").trim();
  const isEdit = Boolean(classIdFromRoute);

  const dayOptions = [
    { value: "mon", label: "Mon" },
    { value: "tue", label: "Tue" },
    { value: "wed", label: "Wed" },
    { value: "thu", label: "Thu" },
    { value: "fri", label: "Fri" },
    { value: "sat", label: "Sat" },
    { value: "sun", label: "Sun" },
  ];

  // default values
  const initial = useMemo(() => normalizeDefaults(defaultValues), [defaultValues]);
  const [form, setForm] = useState<Required<ClassFormDefaults>>(initial);

  // Multi-day creation (only for NEW)
  const [selectedDays, setSelectedDays] = useState<string[]>(() => {
    const d = String(initial.day || "").trim();
    return d ? [d] : [];
  });

  // programs dropdown
  const [programOptions, setProgramOptions] = useState<{ value: string; label: string }[]>([]);
  // coaches dropdown
  const [coachOptions, setCoachOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    async function loadPrograms() {
      try {
        const res = await fetch("/api/admin/programs", { method: "GET" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;

        const rows = Array.isArray(data?.programs) ? data.programs : [];
        const opts = rows
          .map((p: any) => ({ value: String(p.id || "").trim(), label: String(p.name || "").trim() }))
          .filter((o: any) => o.value && o.label);

        opts.sort((a: any, b: any) => a.label.localeCompare(b.label));
        setProgramOptions(opts);
      } catch { }
    }

    async function loadCoaches() {
      try {
        const res = await fetch("/api/admin/coaches", { method: "GET" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;

        const rows = Array.isArray(data?.coaches) ? data.coaches : [];
        // coaches endpoint devuelve {id,label}
        const opts = rows
          .map((c: any) => ({ value: String(c.id || "").trim(), label: String(c.label || "").trim() }))
          .filter((o: any) => o.value && o.label);

        opts.sort((a: any, b: any) => a.label.localeCompare(b.label));
        setCoachOptions(opts);
      } catch { }
    }

    loadPrograms();
    loadCoaches();
  }, []);

  const resolvedProgramOptions = useMemo(() => {
    const cur = String(form.programId || "").trim();
    if (!cur) return programOptions;
    const exists = programOptions.some((o) => o.value === cur);
    return exists ? programOptions : [{ value: cur, label: cur }, ...programOptions];
  }, [programOptions, form.programId]);


  const resolvedCoachOptions = useMemo(() => {
    const cur = String(form.coachId || "").trim();
    if (!cur) return coachOptions;
    const exists = coachOptions.some((o) => o.value === cur);
    return exists ? coachOptions : [{ value: cur, label: cur }, ...coachOptions];
  }, [coachOptions, form.coachId]);

  // Sync defaults (edit)
  useEffect(() => {
    setForm(normalizeDefaults(defaultValues));
  }, [defaultValues]);

  const handleSave = async () => {
    try {
      // status: lo dejamos fijo en scheduled (cancelar se hace después si querés)
      const payload = {
        id: classIdFromRoute || undefined,
        programId: String(form.programId || "").trim(),
        coachId: String(form.coachId || "").trim(),
        day: String(form.day || "").trim(),
        time: String(form.time || "").trim(),
        durationMin: String(form.durationMin || "").trim(),
        capacity: String(form.capacity || "").trim(),
        status: String(form.status || "scheduled").trim(),
      };

      if (!payload.programId || !payload.coachId || !payload.time || !payload.durationMin || !payload.capacity) return;

      async function postOne(dayValue: string) {
        const res = await fetch("/api/admin/classes", {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, day: dayValue }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Failed to save");
      }

      if (!isEdit && selectedDays.length > 0) {
        for (const d of selectedDays) await postOne(d);
      } else {
        await postOne(payload.day);
      }

      router.push("/admin/classes");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = () => router.back();

  return (
    <div className="space-y-6">
      {/* Details */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            Class Details
          </h2>
        </div>

        <div className="p-4 sm:p-6 dark:border-gray-800">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <Label>Program</Label>
              <Select
                key={`program-${resolvedProgramOptions.length}-${form.programId}`}
                options={resolvedProgramOptions}
                placeholder="Select program"
                onChange={(v) => setForm((p) => ({ ...p, programId: String(v) }))}
                defaultValue={form.programId}
              />

            </div>

            <div>
              <Label>Coach</Label>
              <Select
                key={`coach-${resolvedCoachOptions.length}-${form.coachId}`}
                options={resolvedCoachOptions}
                placeholder="Select coach"
                onChange={(value) => setForm((p) => ({ ...p, coachId: String(value) }))}
                defaultValue={form.coachId}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            Schedule
          </h2>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div>
              <Label>Days</Label>

              {isEdit ? (
                <Select
                  options={dayOptions}
                  placeholder="Select day"
                  onChange={(value) => setForm((p) => ({ ...p, day: String(value) }))}
                  defaultValue={form.day}
                />
              ) : (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {dayOptions.map((d) => {
                    const checked = selectedDays.includes(d.value);
                    return (
                      <label
                        key={d.value}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${checked
                            ? "border-brand-300 bg-brand-50 text-brand-600 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300"
                            : "border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300"
                          }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          onChange={() => {
                            setSelectedDays((prev) => {
                              if (prev.includes(d.value)) return prev.filter((x) => x !== d.value);
                              return [...prev, d.value];
                            });
                          }}
                        />
                        {d.label}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <Label>Time</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
              />
            </div>

            <div>
              <Label>Duration (min)</Label>
              <Input
                type="number"
                placeholder="60"
                value={form.durationMin}
                onChange={(e) => setForm((p) => ({ ...p, durationMin: e.target.value }))}
              />
            </div>

            <div>
              <Label>Capacity</Label>
              <Input
                type="number"
                placeholder="12"
                value={form.capacity}
                onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
        <Button variant="primary" onClick={handleSave}>{primaryButtonLabel}</Button>
      </div>
    </div>
  );
}
