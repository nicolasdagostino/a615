import ComponentCard from "@/components/common/ComponentCard";
import AddProgramForm from "@/components/programs/AddProgramForm";
import { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Edit Program | Admin",
  description: "Edit program page",
};

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const baseUrl = await getBaseUrl();
  const h = await headers();

  const res = await fetch(`${baseUrl}/api/admin/programs?id=${encodeURIComponent(id)}`, {
    cache: "no-store",
    headers: { cookie: h.get("cookie") || "" },
  });

  const json = await res.json().catch(() => ({} as any));
  const p = (json as any)?.program || null;

  return (
    <div className="space-y-5 sm:space-y-6">
      <ComponentCard title="Edit Program">
        <AddProgramForm
          primaryButtonLabel="Update Program"
          defaultValues={{
            id: String(p?.id || id),
            name: String(p?.name || ""),
          }}
        />
      </ComponentCard>
    </div>
  );
}
