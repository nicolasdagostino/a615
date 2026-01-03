import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PaymentsTable from "@/components/payments/PaymentsTable";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payments | TailAdmin - Next.js Dashboard Template",
  description: "Payments page",
};

export default function PaymentsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Payments" />
      <PaymentsTable />
    </div>
  );
}
