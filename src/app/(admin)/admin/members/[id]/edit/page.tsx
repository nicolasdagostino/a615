"use client";

import { use, useEffect, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import AddMemberForm, { type MemberFormDefaults } from "@/components/members/AddMemberForm";

export default function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
const [loading, setLoading] = useState(true);
  const [defaults, setDefaults] = useState<MemberFormDefaults | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/members?id=" + encodeURIComponent(id));
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(String((data as any)?.error || "Failed to load member"));
        }

        const m = (data as any)?.member || {};
        const nextDefaults: MemberFormDefaults = {
          fullName: m.fullName || "",
          email: m.email || "",
          phone: m.phone || "",
          dob: m.dob || "",
          notes: m.notes || "",
          plan: m.plan || "",
          monthlyFee: m.monthlyFee || "",
          expiresAt: m.expiresAt || "",
          credits: m.credits || "",
          status: m.status || "",
          paymentMethod: m.paymentMethod || "",
          startDate: m.startDate || "",
        };

        if (!alive) return;
        setDefaults(nextDefaults);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setDefaults(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    if (id) load();

    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <ComponentCard title="Edit Member">
        {loading ? (
          <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        ) : defaults ? (
          <AddMemberForm memberId={id} defaultValues={defaults} primaryButtonLabel="Save Changes" />
        ) : (
          <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
            Could not load this member.
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
