import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AddReservationForm from "@/components/reservations/AddReservationForm";
import { classesMock } from "@/mocks/classes";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Reservation | TailAdmin - Next.js Dashboard Template",
  description: "Add Reservation page",
};

export default async function AddReservationPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; time?: string; date?: string }>;
}) {
  const sp = await searchParams;

  const day = sp.day ?? "";
  const time = sp.time ?? "";
  const date = sp.date ?? "2026-01-01";

  const matchedClass = day && time
    ? classesMock.find((c) => c.day === day && c.time === time)
    : undefined;

  const backHref =
    day && time && date
      ? `/admin/reservations?day=${encodeURIComponent(day)}&time=${encodeURIComponent(
          time
        )}&date=${encodeURIComponent(date)}`
      : "/admin/reservations";

  return (
    <div>
      <PageBreadcrumb pageTitle="Add Reservation" />
      <AddReservationForm
        backHref={backHref}
        initialValues={{
          date,
          classId: matchedClass ? String(matchedClass.id) : "",
        }}
      />
    </div>
  );
}
