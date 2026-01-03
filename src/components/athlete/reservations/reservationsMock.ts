export type ClassSession = {
  id: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  coach: string;
  type: "CrossFit" | "Open" | "Hyrox" | "Weightlifting";
  capacity: number;
  reservedCount: number;
};

export type Reservation = {
  id: number;
  athleteId: number;
  sessionId: number;
  createdAt: string; // ISO
};

export const sessionsMock: ClassSession[] = [
  { id: 101, date: "2026-01-02", time: "07:30", title: "Morning WOD", coach: "Santi", type: "CrossFit", capacity: 12, reservedCount: 9 },
  { id: 102, date: "2026-01-02", time: "18:00", title: "WOD", coach: "Majo", type: "CrossFit", capacity: 14, reservedCount: 14 },
  { id: 103, date: "2026-01-03", time: "09:00", title: "Open Gym", coach: "—", type: "Open", capacity: 16, reservedCount: 5 },
  { id: 104, date: "2026-01-03", time: "18:00", title: "Hyrox Engine", coach: "Leo", type: "Hyrox", capacity: 10, reservedCount: 6 },
  { id: 105, date: "2026-01-05", time: "07:30", title: "Weightlifting", coach: "Majo", type: "Weightlifting", capacity: 8, reservedCount: 3 },
  { id: 106, date: "2026-01-05", time: "18:00", title: "WOD", coach: "Santi", type: "CrossFit", capacity: 14, reservedCount: 10 },
  { id: 107, date: "2026-01-06", time: "19:00", title: "WOD", coach: "Leo", type: "CrossFit", capacity: 12, reservedCount: 7 },
];

export const reservationsMock: Reservation[] = [
  { id: 1, athleteId: 1, sessionId: 101, createdAt: "2026-01-01T10:00:00.000Z" },
  { id: 2, athleteId: 1, sessionId: 104, createdAt: "2026-01-01T11:00:00.000Z" },
];
