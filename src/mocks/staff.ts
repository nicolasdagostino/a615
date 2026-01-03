export type StaffRole = "Owner" | "Coach" | "Staff";
export type StaffStatus = "Active" | "Inactive";

export type StaffRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;
  createdAt: string;
};

export const staffMock: StaffRow[] = [
  {
    id: 1,
    name: "Nicolás D'Agostino",
    email: "nicolas@box.com",
    phone: "+34 600 000 001",
    role: "Owner",
    status: "Active",
    createdAt: "2025-12-10",
  },
  {
    id: 2,
    name: "Martina López",
    email: "martina@box.com",
    phone: "+34 600 000 002",
    role: "Coach",
    status: "Active",
    createdAt: "2025-12-18",
  },
  {
    id: 3,
    name: "Juan Pérez",
    email: "juan@box.com",
    phone: "+34 600 000 003",
    role: "Coach",
    status: "Inactive",
    createdAt: "2025-11-02",
  },
  {
    id: 4,
    name: "Sofía García",
    email: "sofia@box.com",
    phone: "+34 600 000 004",
    role: "Staff",
    status: "Active",
    createdAt: "2025-10-22",
  },
];
