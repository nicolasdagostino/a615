export type ClassMock = {
  id: number;
  name: string;
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  time: string; // "18:00"
  status: "scheduled" | "full" | "cancelled";
};

export const classesMock: ClassMock[] = [
  { id: 101, name: "CrossFit", day: "Mon", time: "18:00", status: "scheduled" },
  { id: 102, name: "Open Box", day: "Mon", time: "19:00", status: "scheduled" },
  { id: 103, name: "Weightlifting", day: "Tue", time: "18:00", status: "scheduled" },
  { id: 104, name: "Gymnastics", day: "Wed", time: "18:00", status: "scheduled" },
];
