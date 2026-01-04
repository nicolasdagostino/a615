"use client";

import { useEffect, useMemo, useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";

type StaffRole = "Owner" | "Coach" | "Staff";
type StaffStatus = "Active" | "Inactive";

type StaffFormValues = {
  name: string;
  email: string;
  phone: string;
  role: StaffRole | "";
  status: StaffStatus | "";
};

function mapUiRoleToAppRole(role: StaffRole): "admin" | "coach" {
  if (role === "Owner") return "admin";
  // Coach o Staff -> coach (porque no existe "staff" en profiles.role)
  return "coach";
}

export default function AddStaffForm({
  defaultValues,
}: {
  defaultValues?: Partial<StaffFormValues>;
}) {
  const roles = [
    { value: "Owner", label: "Owner" },
    { value: "Coach", label: "Coach" },
    { value: "Staff", label: "Staff" },
  ];

  const statuses = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ];

  const [form, setForm] = useState<StaffFormValues>({
    name: "",
    email: "",
    phone: "",
    role: "",
    status: "",
  });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<
    null | { variant: "success" | "error"; title: string; message: string }
  >(null);

  useEffect(() => {
    setForm({
      name: defaultValues?.name ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      role: (defaultValues?.role as StaffRole) ?? "",
      status: (defaultValues?.status as StaffStatus) ?? "",
    });
  }, [defaultValues]);

  const canSubmit = useMemo(() => {
    return (
      !!form.name.trim() &&
      !!form.email.trim() &&
      form.email.includes("@") &&
      !!form.role &&
      !loading
    );
  }, [form.name, form.email, form.role, loading]);

  const handleCancel = () => {
    setFeedback(null);
    setForm({ name: "", email: "", phone: "", role: "", status: "" });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setFeedback(null);
    setLoading(true);

    try {
      const appRole = mapUiRoleToAppRole(form.role as StaffRole);

      const payload = {
        fullName: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || "",
        role: appRole,
        // status es UI-only por ahora; si luego lo guardás en otra tabla, lo conectamos
        status: form.status || "",
      };

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFeedback({
          variant: "error",
          title: "Could not invite staff",
          message: String(data?.error || "Could not invite the staff member."),
        });
        setLoading(false);
        return;
      }

      setFeedback({
        variant: "success",
        title: "Invitation sent",
        message: `Invitation sent to: ${data?.email}. They must open the email and create their password.`,
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setFeedback({
        variant: "error",
        title: "Unexpected error",
        message: "Unexpected error while inviting the staff member.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {feedback ? (
        <Alert
          variant={feedback.variant}
          title={feedback.title}
          message={feedback.message}
        />
      ) : null}

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            Staff Details
          </h2>
        </div>

        <div className="p-4 sm:p-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <Label>Full name</Label>
                <Input
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={form.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Phone</Label>
                <Input
                  placeholder="Enter phone"
                  value={form.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Role</Label>
                <Select
                  options={roles}
                  placeholder="Select a role"
                  onChange={(value) =>
                    setForm((p) => ({ ...p, role: value as StaffRole }))
                  }
                  defaultValue={form.role}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  options={statuses}
                  placeholder="Select status"
                  onChange={(value) =>
                    setForm((p) => ({ ...p, status: value as StaffStatus }))
                  }
                  defaultValue={form.status}
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
          {loading ? "Inviting..." : defaultValues ? "Save Staff" : "Add Staff"}
        </Button>
      </div>
    </div>
  );
}
