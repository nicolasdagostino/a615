"use client";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";

type StaffRole = "Owner" | "Coach" | "Staff";
type StaffStatus = "Active" | "Inactive";

type StaffFormValues = {
  name: string;
  email: string;
  phone: string;
  role: StaffRole | "";
  status: StaffStatus | "";
};

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

  const handleSelectChange = (value: string) => {
    // mock only
    console.log("Selected:", value);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            Staff Details
          </h2>
        </div>

        <div className="p-4 sm:p-6">
          <form>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <Label>Full name</Label>
                <Input placeholder="Enter full name" defaultValue={defaultValues?.name ?? ""} />
              </div>

              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="Enter email" defaultValue={defaultValues?.email ?? ""} />
              </div>

              <div>
                <Label>Phone</Label>
                <Input placeholder="Enter phone" defaultValue={defaultValues?.phone ?? ""} />
              </div>

              <div>
                <Label>Role</Label>
                <Select
                  options={roles}
                  placeholder="Select a role"
                  onChange={handleSelectChange}
                  defaultValue={defaultValues?.role ?? ""}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  options={statuses}
                  placeholder="Select status"
                  onChange={handleSelectChange}
                  defaultValue={defaultValues?.status ?? ""}
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline">Cancel</Button>
        <Button variant="primary">
          {defaultValues ? "Save Staff" : "Add Staff"}
        </Button>
      </div>
    </div>
  );
}
