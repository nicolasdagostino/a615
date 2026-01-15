"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";

export type ClassFormDefaults = {
    id?: string;
  name?: string;
  coach?: string;
  type?: string; // crossfit | open-box | weightlifting | gymnastics
  day?: string;  // mon..sun
  time?: string; // HH:MM
  durationMin?: string; // "60"
  capacity?: string;    // "12"
  status?: string;      // scheduled | full | cancelled
  notes?: string;
};

type Props = {
  defaultValues?: ClassFormDefaults;
  primaryButtonLabel?: string;
};

function normalizeDefaults(d?: ClassFormDefaults): Required<ClassFormDefaults> {
  return {
      id: d?.id ?? "",
    name: d?.name ?? "",
    coach: d?.coach ?? "",
    type: d?.type ?? "",
    day: d?.day ?? "",
    time: d?.time ?? "",
    durationMin: d?.durationMin ?? "",
    capacity: d?.capacity ?? "",
    status: d?.status ?? "",
    notes: d?.notes ?? "",
  };
}

export default function AddClassForm({
  defaultValues,
  primaryButtonLabel = "Save Class",
}: Props) {
  const typeOptions = [
    { value: "crossfit", label: "CrossFit" },
    { value: "open-box", label: "Open Box" },
    { value: "weightlifting", label: "Weightlifting" },
    { value: "gymnastics", label: "Gymnastics" },
  ];

  const dayOptions = [
    { value: "mon", label: "Mon" },
    { value: "tue", label: "Tue" },
    { value: "wed", label: "Wed" },
    { value: "thu", label: "Thu" },
    { value: "fri", label: "Fri" },
    { value: "sat", label: "Sat" },
    { value: "sun", label: "Sun" },
  ];

  const statusOptions = [
    { value: "scheduled", label: "Scheduled" },
    { value: "full", label: "Full" },
    { value: "cancelled", label: "Cancelled" },
  ];
  const [coachOptions, setCoachOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    let alive = true;

    async function loadCoaches() {
      try {
        const res = await fetch("/api/admin/members", { method: "GET" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;

        const rows = Array.isArray((data as any)?.members) ? (data as any).members : [];
        const coaches = rows
          .filter((m: any) => ["coach","admin"].includes(String(m?.role || "").toLowerCase()))
          .map((m: any) => {
            const name = String(m?.user?.name || "").trim();
            return { value: name, label: name };
          })
          .filter((o: any) => o.value);

        coaches.sort((a: any, b: any) => String(a.label).localeCompare(String(b.label)));

        if (alive) setCoachOptions(coaches);
      } catch {
        // noop
      }
    }

    loadCoaches();
    return () => {
      alive = false;
    };
  }, []);


  // ✅ IMPORTANT: inicializamos desde defaultValues para que Select tome defaultValue al mount.
  const initial = useMemo(() => normalizeDefaults(defaultValues), [defaultValues]);

  const [form, setForm] = useState<Required<ClassFormDefaults>>(initial);

  const resolvedCoachOptions = useMemo(() => {
    const cur = String(form.coach || "").trim();
    if (!cur) return coachOptions;
    const exists = coachOptions.some((o) => o.value === cur);
    return exists ? coachOptions : [{ value: cur, label: cur }, ...coachOptions];
  }, [coachOptions, form.coach]);


    const router = useRouter();
    const params = useParams<{ id?: string }>();

    const classIdFromRoute = String((params as any)?.id || "").trim();
    const isEdit = Boolean(classIdFromRoute);

    const handleSave = async () => {
      try {
        const payload = {
          id: classIdFromRoute || undefined,
          name: String(form.name || "").trim(),
          coach: String(form.coach || "").trim(),
          type: String(form.type || "").trim(),
          day: String(form.day || "").trim(),
          time: String(form.time || "").trim(),
          durationMin: String(form.durationMin || "").trim(),
          capacity: String(form.capacity || "").trim(),
          status: String(form.status || "").trim(),
          notes: String(form.notes || "").trim(),
        };

        if (!payload.name || !payload.coach || !payload.type || !payload.day || !payload.time || !payload.status) {
          return;
        }

        const res = await fetch("/api/admin/classes", {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Failed to save");

        router.push("/admin/classes");
        router.refresh();
      } catch (e) {}
    };

    const handleCancel = () => {
      router.back();
    };


  // Si cambian defaults (raro, pero posible), sincronizamos.
  useEffect(() => {
    setForm(normalizeDefaults(defaultValues));
  }, [defaultValues]);

  return (
    <div className="space-y-6">
      {/* Class Details */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            Class Details
          </h2>
        </div>

        <div className="p-4 sm:p-6 dark:border-gray-800">
          <form>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <Label>Class Name</Label>
                <Input
                  placeholder="CrossFit"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Coach</Label>
                <Select
                  key={`coach-${resolvedCoachOptions.length}-${form.coach}`}
                  options={resolvedCoachOptions}
                  placeholder="Select coach"
                  onChange={(value) => setForm((p) => ({ ...p, coach: value }))}
                  defaultValue={form.coach}
                />
              </div>

              <div>
                <Label>Type</Label>
                <Select
                  options={typeOptions}
                  placeholder="Select type"
                  onChange={(value) => setForm((p) => ({ ...p, type: value }))}
                  defaultValue={form.type}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  options={statusOptions}
                  placeholder="Select status"
                  onChange={(value) =>
                    setForm((p) => ({ ...p, status: value }))
                  }
                  defaultValue={form.status}
                />
              </div>

              <div className="col-span-full">
                <Label>Notes</Label>
                <TextArea
                  rows={6}
                  placeholder="Notes (optional)"
                  value={form.notes}
                  onChange={(v) =>
                    setForm((p) => ({
                      ...p,
                      notes: typeof v === "string" ? v : ((v as any)?.target?.value ?? ""),
                    }))
                  }
                />
              </div>
            </div>
          </form>
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
              <Label>Day</Label>
              <Select
                options={dayOptions}
                placeholder="Select day"
                onChange={(value) => setForm((p) => ({ ...p, day: value }))}
                defaultValue={form.day}
              />
            </div>

            <div>
              <Label>Time</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) =>
                  setForm((p) => ({ ...p, time: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Duration (min)</Label>
              <Input
                type="number"
                placeholder="60"
                value={form.durationMin}
                onChange={(e) =>
                  setForm((p) => ({ ...p, durationMin: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Capacity</Label>
              <Input
                type="number"
                placeholder="12"
                value={form.capacity}
                onChange={(e) =>
                  setForm((p) => ({ ...p, capacity: e.target.value }))
                }
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
