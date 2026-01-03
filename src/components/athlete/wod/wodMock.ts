export type WodRow = {
  id: number;
  date: string; // YYYY-MM-DD
  title: string;
  notes?: string;
};

export const wodMock: WodRow[] = [
  { id: 1, date: "2026-01-02", title: "WOD A", notes: "For time · 21-15-9" },
  { id: 2, date: "2026-01-02", title: "WOD B", notes: "EMOM 12 · Row + Burpees" },
  { id: 3, date: "2026-01-03", title: "WOD", notes: "Strength + Metcon" },
];
