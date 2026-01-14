import ComponentCard from "@/components/common/ComponentCard";
//import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import MembersTable from "@/components/members/MembersTable";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Members | TailAdmin - Next.js Dashboard Template",
  description: "Members page (mock data) based on TailAdmin Data Table 3",
};

export default function MembersPage() {
  return (
    <div>
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Members" desc="Manage members, plans, and membership status.">
          <MembersTable />
        </ComponentCard>
      </div>
    </div>
  );
}
