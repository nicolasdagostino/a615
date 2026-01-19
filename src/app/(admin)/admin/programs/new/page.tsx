import ComponentCard from "@/components/common/ComponentCard";
import AddProgramForm from "@/components/programs/AddProgramForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Program | Admin",
  description: "Add program page",
};

export default function AddProgramPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <ComponentCard title="Add Program">
        <AddProgramForm primaryButtonLabel="Create Program" />
      </ComponentCard>
    </div>
  );
}
