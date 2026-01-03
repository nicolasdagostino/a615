import Link from "next/link";
import AddReservationForm from "@/components/reservations/AddReservationForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { reservationsMock } from "@/mocks/reservations";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Reservation | TailAdmin - Next.js Dashboard Template",
  description: "Edit Reservation page",
};

export default async function EditReservationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ day?: string; time?: string; date?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);

  const reservationId = Number(id);
  const reservation = reservationsMock.find((r) => r.id === reservationId);
  if (!reservation) return notFound();

  const day = sp.day ?? "";
  const time = sp.time ?? "";
  const date = sp.date ?? "";

  const backHref =
    day && time && date
      ? `/admin/reservations?day=${encodeURIComponent(day)}&time=${encodeURIComponent(
          time
        )}&date=${encodeURIComponent(date)}`
      : "/admin/reservations";

  return (
    <div>
      <div className="mb-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
        >
          <svg
            className="fill-current"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M2.58203 9.99868C2.58174 10.1909 2.6549 10.3833 2.80152 10.53L7.79818 15.5301C8.09097 15.8231 8.56584 15.8233 8.85883 15.5305C9.15183 15.2377 9.152 14.7629 8.85921 14.4699L5.13911 10.7472L16.6665 10.7472C17.0807 10.7472 17.4165 10.4114 17.4165 9.99715C17.4165 9.58294 17.0807 9.24715 16.6665 9.24715L5.14456 9.24715L8.85919 5.53016C9.15199 5.23717 9.15184 4.7623 8.85885 4.4695C8.56587 4.1767 8.09099 4.17685 7.79819 4.46984L2.84069 9.43049C2.68224 9.568 2.58203 9.77087 2.58203 9.99715Z"
            />
          </svg>
          Back to roster
        </Link>
      </div>

      <PageBreadcrumb pageTitle="Edit Reservation" />

      <AddReservationForm
        submitLabel="Save Changes"
        initialValues={{
          memberId: String(reservation.member.id),
          classId: String(reservation.classItem.id),
          date: reservation.date,
          status: reservation.status,
          notes: reservation.notes ?? "",
        }}
      />
    </div>
  );
}
