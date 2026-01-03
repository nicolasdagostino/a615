export type PaymentStatus = "Al día" | "Pendiente";
export type MemberStatus = "Activo" | "Pausado";

export type AthleteProfile = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string; // YYYY-MM-DD
  location: string;

  plan: string;
  memberStatus: MemberStatus;
  paymentStatus: PaymentStatus;
  renewalDate: string; // YYYY-MM-DD

  attendanceThisMonth: number;
  totalAttendance: number;
  nextMilestone: number; // e.g. 50 or 100
  remainingToMilestone: number;

  emergency: {
    name: string;
    relation: string;
    phone: string;
  };

  health: {
    injuries: string;
    allergies: string;
    waiverSigned: boolean;
  };

  notes: string;
  avatarUrl: string;
};

export const athleteProfileMock: AthleteProfile = {
  id: 1,
  fullName: "Juan Pérez",
  email: "juanperez@gmail.com",
  phone: "+34 612 345 678",
  birthDate: "1995-06-12",
  location: "Madrid, España",

  plan: "Unlimited",
  memberStatus: "Activo",
  paymentStatus: "Al día",
  renewalDate: "2026-01-15",

  attendanceThisMonth: 12,
  totalAttendance: 43,
  nextMilestone: 50,
  remainingToMilestone: 7,

  emergency: {
    name: "María Pérez",
    relation: "Madre",
    phone: "+34 611 222 333",
  },

  health: {
    injuries: "Molestia leve en hombro derecho.",
    allergies: "Ninguna.",
    waiverSigned: true,
  },

  notes: "Objetivo: mejorar gimnásticos y consistencia.",
  avatarUrl: "/images/user/user-01.jpg",
};
