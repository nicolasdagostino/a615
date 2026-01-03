export type AthleteClassRow = {
  id: number;
  name: string;
  coach: string;
  day: string;
  time: string;
  capacity: number;
};

export const classesMock: AthleteClassRow[] = [
  { id: 1, name: "CrossFit", coach: "Nico", day: "Lunes", time: "07:00", capacity: 12 },
  { id: 2, name: "CrossFit", coach: "Meli", day: "Lunes", time: "18:00", capacity: 12 },
  { id: 3, name: "Endurance", coach: "Sofi", day: "Martes", time: "19:00", capacity: 14 },
  { id: 4, name: "Open Gym", coach: "-", day: "Miércoles", time: "12:30", capacity: 20 },
  { id: 5, name: "CrossFit", coach: "Pablo", day: "Jueves", time: "09:00", capacity: 12 },
];
