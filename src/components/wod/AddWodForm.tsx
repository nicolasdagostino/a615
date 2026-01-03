"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";

type WodType = "metcon" | "strength" | "skill" | "hero" | "benchmark" | "";
type WodStatus = "draft" | "published" | "";

type WodFormValues = {
  date: string;
  track: string;
  title: string;
  type: WodType;
  status: WodStatus;
  workout: string;
  coachNotes: string;
};

export default function AddWodForm({
  initialValues,
  submitLabel = "Create WOD",
}: {
  initialValues?: Partial<WodFormValues>;
  submitLabel?: string;
}) {
  const values: WodFormValues = {
    date: "2026-01-01",
    track: "",
    title: "",
    type: "",
    status: "",
    workout: "",
    coachNotes: "",
    ...initialValues,
  };

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

  const handleSelectChange = (value: string) => {
    // mock only
    console.log("Selected:", value);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            WOD Details
          </h2>
        </div>

        <div className="p-4 sm:p-6 dark:border-gray-800">
          <form>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <Label>Date</Label>
                <Input type="date" defaultValue={values.date} />
              </div>

              <div>
                <Label>Track</Label>
                <Input placeholder='e.g. "CrossFit 18:00"' defaultValue={values.track} />
              </div>

              <div className="md:col-span-2">
                <Label>Title</Label>
                <Input placeholder="Optional name (Fran, Open 25.1...)" defaultValue={values.title} />
              </div>

              <div>
                <Label>Type</Label>
                <Select
                  options={typeOptions}
                  placeholder="Select type"
                  onChange={handleSelectChange}
                  defaultValue={values.type}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  options={statusOptions}
                  placeholder="Select status"
                  onChange={handleSelectChange}
                  defaultValue={values.status}
                />
              </div>

              <div className="md:col-span-2">
                <Label>Workout</Label>
                <TextArea rows={10} placeholder="Write the WOD..." defaultValue={values.workout} />
              </div>

              <div className="md:col-span-2">
                <Label>Coach Notes</Label>
                <TextArea rows={6} placeholder="Scaling, stimulus, notes..." defaultValue={values.coachNotes} />
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline">Cancel</Button>
        <Button variant="primary">{submitLabel}</Button>
      </div>
    </div>
  );
}
