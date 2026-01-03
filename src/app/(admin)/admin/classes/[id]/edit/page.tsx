import ComponentCard from "@/components/common/ComponentCard";
import AddClassForm from "@/components/classes/AddClassForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Class | TailAdmin - Next.js Dashboard Template",
  description: "Edit class page (mock)",
};

type ClassRow = {
  id: number;
  name: string;
  coach: string;     // Nico | Laura | Pablo (label en tabla)
  day: string;       // Mon..Sun (label en tabla)
  time: string;      // "18:00"
  durationMin: number;
  capacity: number;
  type: string;      // CrossFit | Open Box | ...
  status: string;    // Scheduled | Full | Cancelled
  notes?: string;
};

const classesMock: ClassRow[] = [
  { id: 1, name: "CrossFit", coach: "Nico", day: "Mon", time: "18:00", durationMin: 60, capacity: 12, type: "CrossFit", status: "Scheduled", notes: "WOD + skill" },
  { id: 2, name: "Open Box", coach: "Nico", day: "Mon", time: "19:00", durationMin: 60, capacity: 10, type: "Open Box", status: "Full", notes: "Solo open gym" },
  { id: 3, name: "Weightlifting", coach: "Laura", day: "Tue", time: "18:00", durationMin: 75, capacity: 8, type: "Weightlifting", status: "Scheduled" },
];

function mapCoach(label: string) {
  const v = label.trim().toLowerCase();
  if (v === "nico") return "nico";
  if (v === "laura") return "laura";
  if (v === "pablo") return "pablo";
  return "";
}

function mapType(label: string) {
  const v = label.trim().toLowerCase();
  if (v.includes("crossfit")) return "crossfit";
  if (v.includes("open")) return "open-box";
  if (v.includes("weight")) return "weightlifting";
  if (v.includes("gym")) return "gymnastics";
  return "";
}

function mapStatus(label: string) {
  const v = label.trim().toLowerCase();
  if (v.includes("scheduled")) return "scheduled";
  if (v.includes("full")) return "full";
  if (v.includes("cancel")) return "cancelled";
  return "";
}

function mapDay(label: string) {
  const v = label.trim().toLowerCase();
  if (v.startsWith("mon")) return "mon";
  if (v.startsWith("tue")) return "tue";
  if (v.startsWith("wed")) return "wed";
  if (v.startsWith("thu")) return "thu";
  if (v.startsWith("fri")) return "fri";
  if (v.startsWith("sat")) return "sat";
  if (v.startsWith("sun")) return "sun";
  return "";
}

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const classId = Number(id);

  const cls = classesMock.find((c) => c.id === classId);

  return (
    <div>
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Edit Class">
          <AddClassForm
            primaryButtonLabel="Update Class"
            defaultValues={{
              name: cls?.name ?? "",
              coach: cls?.coach ? mapCoach(cls.coach) : "",
              type: cls?.type ? mapType(cls.type) : "",
              status: cls?.status ? mapStatus(cls.status) : "",
              day: cls?.day ? mapDay(cls.day) : "",
              time: cls?.time ?? "",
              durationMin: cls?.durationMin ? String(cls.durationMin) : "",
              capacity: cls?.capacity ? String(cls.capacity) : "",
              notes: cls?.notes ?? "",
            }}
          />
        </ComponentCard>
      </div>
    </div>
  );
}
