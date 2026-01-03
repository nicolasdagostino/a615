import ComponentCard from "@/components/common/ComponentCard";
import ReservationsTable from "@/components/reservations/ReservationsTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reservations | TailAdmin - Next.js Dashboard Template",
  description: "Reservations list (mock)",
};

export default function ReservationsPage() {
  return (
    <div>
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Reservations">
          <ReservationsTable />
        </ComponentCard>
      </div>
    </div>
  );
}
