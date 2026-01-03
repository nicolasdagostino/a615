import ComponentCard from "@/components/common/ComponentCard";
import AddMemberForm from "@/components/members/AddMemberForm";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Member | TailAdmin - Next.js Dashboard Template",
  description: "Add member page (mock)",
};

export default function AddMemberPage() {
  return (
    <div>
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Add Member">
          <AddMemberForm />
        </ComponentCard>
      </div>
    </div>
  );
}
