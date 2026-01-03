import ComponentCard from "@/components/common/ComponentCard";
import AddMemberForm from "@/components/members/AddMemberForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Member | TailAdmin - Next.js Dashboard Template",
  description: "Edit member page (mock)",
};

type MemberRow = {
  id: number;
  user: { name: string; email: string };
  plan: string;
  fee: string;
  expiresAt: string;
  phone?: string;
  dob?: string;
  notes?: string;
  startDate?: string;
  paymentMethod?: string;
  credits?: string;
};

const membersMock: MemberRow[] = [
  {
    id: 1,
    user: { name: "Lindsey Curtis", email: "lindsey@gmail.com" },
    plan: "Unlimited",
    fee: "€79",
    expiresAt: "2026-01-15",
    phone: "+34 600 111 222",
    dob: "1992-05-11",
    notes: "Lesión hombro (historial).",
    startDate: "2025-11-01",
    paymentMethod: "card",
    credits: "0",
  },
  {
    id: 2,
    user: { name: "Kaiya George", email: "kaiya@gmail.com" },
    plan: "3x/week",
    fee: "€59",
    expiresAt: "2026-01-06",
    phone: "+34 600 333 444",
    dob: "1997-09-21",
    notes: "Prefiere clases AM.",
    startDate: "2025-10-15",
    paymentMethod: "transfer",
    credits: "12",
  },
  {
    id: 3,
    user: { name: "Zain Geidt", email: "zain@gmail.com" },
    plan: "Open Box",
    fee: "€49",
    expiresAt: "2025-12-28",
    phone: "+34 600 555 666",
    dob: "1988-01-03",
    notes: "Vencido, renovar.",
    startDate: "2025-08-01",
    paymentMethod: "cash",
    credits: "0",
  },
];

function statusFromExpires(expiresAtISO: string): "active" | "expiring" | "expired" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiresAtISO);
  exp.setHours(0, 0, 0, 0);

  const diffDays = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 7) return "expiring";
  return "active";
}

function mapPlanToSelectValue(planLabel: string) {
  const p = planLabel.trim().toLowerCase();
  if (p === "unlimited") return "unlimited";
  if (p.includes("3x")) return "3x";
  if (p.includes("2x")) return "2x";
  if (p.includes("open")) return "open-box";
  if (p.includes("drop")) return "drop-in";
  return "";
}

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ Next.js 16
  const memberId = Number(id);
  const member = membersMock.find((m) => m.id === memberId);

  return (
    <div>
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Edit Member">
          <AddMemberForm
            primaryButtonLabel="Update Member"
            defaultValues={{
              fullName: member?.user.name ?? "",
              email: member?.user.email ?? "",
              phone: member?.phone ?? "",
              dob: member?.dob ?? "",
              notes: member?.notes ?? "",
              plan: member?.plan ? mapPlanToSelectValue(member.plan) : "",
              monthlyFee: member?.fee ?? "",
              expiresAt: member?.expiresAt ?? "",
              status: member?.expiresAt ? statusFromExpires(member.expiresAt) : "",
              paymentMethod: member?.paymentMethod ?? "",
              startDate: member?.startDate ?? "",
              credits: member?.credits ?? "",
            }}
          />
        </ComponentCard>
      </div>
    </div>
  );
}
