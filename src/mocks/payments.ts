export type PaymentMethod = "cash" | "card" | "transfer";
export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";

export type PaymentMock = {
  id: number;
  memberId: number;
  amount: number;
  currency: "EUR" | "USD";
  method: PaymentMethod;
  status: PaymentStatus;
  date: string; // YYYY-MM-DD
  notes?: string;
};

export const paymentsMock: PaymentMock[] = [
  {
    id: 1,
    memberId: 1,
    amount: 89,
    currency: "EUR",
    method: "card",
    status: "paid",
    date: "2026-01-01",
    notes: "Monthly membership",
  },
  {
    id: 2,
    memberId: 2,
    amount: 89,
    currency: "EUR",
    method: "transfer",
    status: "pending",
    date: "2026-01-02",
    notes: "Awaiting bank confirmation",
  },
  {
    id: 3,
    memberId: 3,
    amount: 15,
    currency: "EUR",
    method: "cash",
    status: "paid",
    date: "2026-01-02",
    notes: "Drop-in",
  },
];
