import ComponentCard from "@/components/common/ComponentCard";
import AddClassForm from "@/components/classes/AddClassForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Class | TailAdmin - Next.js Dashboard Template",
  description: "Add class page (mock)",
};

export default function AddClassPage() {
  return (
    <div>
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Add Class">
          <AddClassForm primaryButtonLabel="Create Class" />
        </ComponentCard>
      </div>
    </div>
  );
}
