import ComponentCard from "@/components/common/ComponentCard";
import AddClassForm from "@/components/classes/AddClassForm";
import { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Edit Class | TailAdmin - Next.js Dashboard Template",
  description: "Edit class page",
};

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const baseUrl = await getBaseUrl();
  const h = await headers();

  const res = await fetch(`${baseUrl}/api/admin/classes?id=${encodeURIComponent(id)}`, {
    cache: "no-store",
    headers: { cookie: h.get("cookie") || "" },
  });

  const json = await res.json().catch(() => ({} as any));
  const cls = (json as any)?.class || null;

  return (
    <div>
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Edit Class">
          <AddClassForm
            primaryButtonLabel="Update Class"
            defaultValues={{
              id: String(cls?.id || id),
              programId: String((cls as any)?.programId || (cls as any)?.program_id || ""),
              coachId: String((cls as any)?.coachId || (cls as any)?.coach_id || ""),
              day: String(cls?.day || ""),
              time: String(cls?.time || ""),
              durationMin: String((cls as any)?.durationMin ?? ""),
              capacity: String((cls as any)?.capacity ?? ""),
              status: String(cls?.status || "scheduled"),
            }}
            
          />
        </ComponentCard>
      </div>
    </div>
  );
}
