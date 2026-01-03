export type ReservationStatus = "confirmed" | "waitlist" | "cancelled" | "no-show";

export type ReservationMock = {
  id: number;
  member: { id: number; name: string; email: string };
  classItem: { id: number; name: string; day: string; time: string };
  date: string; // YYYY-MM-DD
  status: ReservationStatus;
  notes?: string;
};

export const reservationsMock: ReservationMock[] = [
  {
    id: 1,
    member: { id: 1, name: "Lindsey Curtis", email: "lindsey@gmail.com" },
    classItem: { id: 101, name: "CrossFit", day: "Mon", time: "18:00" },
    date: "2026-01-01",
    status: "confirmed",
    notes: "",
  },
  {
    id: 2,
    member: { id: 2, name: "Kaiya George", email: "kaiya@gmail.com" },
    classItem: { id: 101, name: "CrossFit", day: "Mon", time: "18:00" },
    date: "2026-01-01",
    status: "waitlist",
    notes: "",
  },
  {
    id: 3,
    member: { id: 3, name: "Zain Geidt", email: "zain@gmail.com" },
    classItem: { id: 102, name: "Open Box", day: "Mon", time: "19:00" },
    date: "2026-01-01",
    status: "confirmed",
    notes: "",
  },
  {
    id: 4,
    member: { id: 2, name: "Kaiya George", email: "kaiya@gmail.com" },
    classItem: { id: 103, name: "Weightlifting", day: "Tue", time: "18:00" },
    date: "2026-01-02",
    status: "cancelled",
    notes: "Cancelled by member",
  },
];
