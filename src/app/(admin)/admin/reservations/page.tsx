import { Suspense } from "react";
import ReservationsTable from "@/components/reservations/ReservationsTable";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ReservationsTable />
    </Suspense>
  );
}
