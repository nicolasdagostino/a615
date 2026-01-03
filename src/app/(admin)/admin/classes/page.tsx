import ComponentCard from "@/components/common/ComponentCard";
import ClassesTable from "@/components/classes/ClassesTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Classes | TailAdmin - Next.js Dashboard Template",
  description: "Classes list (mock)",
};

export default function ClassesPage() {
  return (
    <div>
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Classes">
          <ClassesTable />
        </ComponentCard>
      </div>
    </div>
  );
}
