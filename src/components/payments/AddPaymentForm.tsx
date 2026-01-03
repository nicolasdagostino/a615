"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";

import { membersMock } from "@/mocks/members";

type PaymentMethod = "cash" | "card" | "transfer" | "";
type PaymentStatus = "paid" | "pending" | "failed" | "refunded" | "";

type PaymentFormValues = {
  memberId: string;
  amount: string;
  currency: "EUR" | "USD";
  method: PaymentMethod;
  status: PaymentStatus;
  date: string;
  notes: string;
};

export default function AddPaymentForm({
  initialValues,
  submitLabel = "Create Payment",
}: {
  initialValues?: Partial<PaymentFormValues>;
  submitLabel?: string;
}) {
  const values: PaymentFormValues = {
    memberId: "",
    amount: "",
    currency: "EUR",
    method: "",
    status: "",
    date: "2026-01-01",
    notes: "",
    ...initialValues,
  };

  const memberOptions = membersMock.map((m) => ({
    value: String(m.id),
    label: `${m.name} (${m.email})`,
  }));

  const methodOptions = [
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "transfer", label: "Transfer" },
  ];

  const statusOptions = [
    { value: "paid", label: "Paid" },
    { value: "pending", label: "Pending" },
    { value: "failed", label: "Failed" },
    { value: "refunded", label: "Refunded" },
  ];

  const currencyOptions = [
    { value: "EUR", label: "EUR" },
    { value: "USD", label: "USD" },
  ];

  const handleSelectChange = (value: string) => {
    console.log("Selected:", value);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            Payment Details
          </h2>
        </div>

        <div className="p-4 sm:p-6 dark:border-gray-800">
          <form>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Member</Label>
                <Select
                  options={memberOptions}
                  placeholder="Select a member"
                  onChange={handleSelectChange}
                  defaultValue={values.memberId}
                />
              </div>

              <div>
                <Label>Amount</Label>
                <Input type="number" placeholder="0" defaultValue={values.amount} />
              </div>

              <div>
                <Label>Currency</Label>
                <Select
                  options={currencyOptions}
                  placeholder="Select currency"
                  onChange={handleSelectChange}
                  defaultValue={values.currency}
                />
              </div>

              <div>
                <Label>Method</Label>
                <Select
                  options={methodOptions}
                  placeholder="Select method"
                  onChange={handleSelectChange}
                  defaultValue={values.method}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  options={statusOptions}
                  placeholder="Select status"
                  onChange={handleSelectChange}
                  defaultValue={values.status}
                />
              </div>

              <div className="md:col-span-2">
                <Label>Date</Label>
                <Input type="date" defaultValue={values.date} />
              </div>

              <div className="md:col-span-2">
                <Label>Notes</Label>
                <textarea rows={5} placeholder="Optional notes..." defaultValue={values.notes} className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline">Cancel</Button>
        <Button variant="primary">{submitLabel}</Button>
      </div>
    </div>
  );
}
