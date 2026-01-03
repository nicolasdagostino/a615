"use client";

import { useState } from "react";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";

export default function SettingsForm() {
  const timezones = [
    { value: "Europe/Madrid", label: "Europe/Madrid" },
    { value: "Europe/London", label: "Europe/London" },
    { value: "America/Argentina/Buenos_Aires", label: "America/Argentina/Buenos_Aires" },
  ];

  const currencies = [
    { value: "EUR", label: "EUR" },
    { value: "USD", label: "USD" },
    { value: "ARS", label: "ARS" },
  ];

  const defaultMemberStatus = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ];

  const handleSelectChange = (value: string) => {
    // mock only
    console.log("Selected:", value);
  };

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(false);
  const [autoRenewDefault, setAutoRenewDefault] = useState(true);

  return (
    <div className="space-y-6">
      {/* Box profile */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            Box Settings
          </h2>
        </div>

        <div className="p-4 sm:p-6">
          <form>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <Label>Box name</Label>
                <Input placeholder="Enter box name" defaultValue="My CrossFit Box" />
              </div>

              <div>
                <Label>Timezone</Label>
                <Select
                  options={timezones}
                  placeholder="Select timezone"
                  onChange={handleSelectChange}
                  defaultValue="Europe/Madrid"
                />
              </div>

              <div>
                <Label>Contact email</Label>
                <Input type="email" placeholder="Enter email" defaultValue="info@mybox.com" />
              </div>

              <div>
                <Label>Contact phone</Label>
                <Input placeholder="Enter phone" defaultValue="+34 600 000 000" />
              </div>

              <div className="col-span-full">
                <Label>Address</Label>
                <Input placeholder="Enter address" defaultValue="Calle Example 123, Madrid" />
              </div>

              <div className="col-span-full">
                <Label>Notes</Label>
                <TextArea rows={4} placeholder="Internal notes (optional)" value="Settings are mock for now." readOnly />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Billing */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            Billing & Payments
          </h2>
        </div>

        <div className="p-4 sm:p-6">
          <form>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <Label>Currency</Label>
                <Select
                  options={currencies}
                  placeholder="Select currency"
                  onChange={handleSelectChange}
                  defaultValue="EUR"
                />
              </div>

              <div>
                <Label>Tax ID (optional)</Label>
                <Input placeholder="Enter Tax ID" defaultValue="" />
              </div>

              <div className="col-span-full">
                <Label>Payment instructions (optional)</Label>
                <TextArea
                  rows={4}
                  placeholder="E.g. bank transfer details / bizum / etc."
                  defaultValue=""
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Members defaults */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            Members Defaults
          </h2>
        </div>

        <div className="p-4 sm:p-6">
          <form>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <Label>Default status</Label>
                <Select
                  options={defaultMemberStatus}
                  placeholder="Select default status"
                  onChange={handleSelectChange}
                  defaultValue="Active"
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <Checkbox checked={autoRenewDefault} onChange={setAutoRenewDefault} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                  Auto-renew by default
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            Notifications
          </h2>
        </div>

        <div className="p-4 sm:p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox checked={emailNotifications} onChange={setEmailNotifications} />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  Email notifications
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Send notifications to members by email.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox checked={whatsappNotifications} onChange={setWhatsappNotifications} />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  WhatsApp notifications
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enable WhatsApp notifications (mock).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline">Cancel</Button>
        <Button variant="primary">Save Settings</Button>
      </div>
    </div>
  );
}
