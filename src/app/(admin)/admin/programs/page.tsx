import ComponentCard from "@/components/common/ComponentCard";
import ProgramsTable from "@/components/programs/ProgramsTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Programs | Admin",
  description: "Programs admin",
};

export default function ProgramsPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <ComponentCard title="Programs">
        <ProgramsTable />
      </ComponentCard>
    </div>
  );
}
