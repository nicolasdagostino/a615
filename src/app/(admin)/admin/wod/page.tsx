import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import WodTable from "@/components/wod/WodTable";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WOD | TailAdmin - Next.js Dashboard Template",
  description: "WOD list page",
};

export default function WodPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="WOD" />
      <WodTable />
    </div>
  );
}
