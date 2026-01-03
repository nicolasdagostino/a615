"use client";

import Link from "next/link";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";

import { classesMock } from "@/mocks/classes";
import { membersMock } from "@/mocks/members";

type ReservationFormValues = {
  memberId: string;
  classId: string;
  date: string;
  status: "confirmed" | "waitlist" | "cancelled" | "no-show" | "";
  notes: string;
};

export default function AddReservationForm({
  initialValues,
  submitLabel = "Create Reservation",
  backHref,
}: {
  initialValues?: Partial<ReservationFormValues>;
  submitLabel?: string;
  backHref?: string;
}) {
  const values: ReservationFormValues = {
    memberId: "",
    classId: "",
    date: "2026-01-01",
    status: "",
    notes: "",
    ...initialValues,
  };

  const memberOptions = membersMock.map((m) => ({
    value: String(m.id),
    label: `${m.name} (${m.email})`,
  }));

  const classOptions = classesMock.map((c) => ({
    value: String(c.id),
    label: `${c.day} ${c.time} — ${c.name}`,
  }));

  const statusOptions = [
    { value: "confirmed", label: "Confirmed" },
    { value: "waitlist", label: "Waitlist" },
    { value: "cancelled", label: "Cancelled" },
    { value: "no-show", label: "No-show" },
  ];

  const handleSelectChange = (value: string) => {
    // mock only
    console.log("Selected:", value);
  };

  return (
    <div className="space-y-6">
      {backHref && (
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <svg
              className="fill-current"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2.58203 9.99868C2.58174 10.1909 2.6549 10.3833 2.80152 10.53L7.79818 15.5301C8.09097 15.8231 8.56584 15.8233 8.85883 15.5305C9.15183 15.2377 9.152 14.7629 8.85921 14.4699L5.13911 10.7472L16.6665 10.7472C17.0807 10.7472 17.4165 10.4114 17.4165 9.99715C17.4165 9.58294 17.0807 9.24715 16.6665 9.24715L5.14456 9.24715L8.85919 5.53016C9.15199 5.23717 9.15184 4.7623 8.85885 4.4695C8.56587 4.1767 8.09099 4.17685 7.79819 4.46984L2.84069 9.43049C2.68224 9.568 2.58203 9.77087 2.58203 9.99715Z"
              />
            </svg>
            Back to roster
          </Link>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            Reservation Details
          </h2>
        </div>

        <div className="p-4 sm:p-6 dark:border-gray-800">
          <form>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <Label>Member</Label>
                <Select
                  options={memberOptions}
                  placeholder="Select a member"
                  onChange={handleSelectChange}
                  defaultValue={values.memberId}
                />
              </div>

              <div>
                <Label>Class</Label>
                <Select
                  options={classOptions}
                  placeholder="Select a class"
                  onChange={handleSelectChange}
                  defaultValue={values.classId}
                />
              </div>

              <div>
                <Label>Date</Label>
                <Input type="date" defaultValue={values.date} />
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

              <div className="col-span-full">
                <Label>Notes</Label>
                <Input placeholder="Optional note" defaultValue={values.notes} />
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
