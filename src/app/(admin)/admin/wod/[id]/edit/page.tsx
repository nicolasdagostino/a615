import ComponentCard from "@/components/common/ComponentCard";
import AddWodForm from "@/components/wod/AddWodForm";
import { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Edit WOD | TailAdmin - Next.js Dashboard Template",
  description: "Edit WOD page",
};

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

export default async function EditWodPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const baseUrl = await getBaseUrl();
  const h = await headers();

  const res = await fetch(`${baseUrl}/api/admin/wods?id=${encodeURIComponent(id)}`, {
    cache: "no-store",
    headers: { cookie: h.get("cookie") || "" },
  });

  const json = await res.json().catch(() => ({} as any));
  const wod = (json as any)?.wod || null;

  return (
    <div>
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Edit WOD">
          <AddWodForm
            wodId={id}
            submitLabel="Save Changes"
            initialValues={{
              date: String(wod?.wodDate || wod?.wod_date || ""),
              programId: String(wod?.programId || wod?.program_id || ""),
              status: wod?.isPublished ? "published" : "draft",
              workout: String(wod?.workout || ""),
            }}
          />
        </ComponentCard>
      </div>
    </div>
  );
}
