export type WodType = "metcon" | "strength" | "skill" | "hero" | "benchmark";
export type WodStatus = "draft" | "published";

export type WodMock = {
  id: number;
  date: string; // YYYY-MM-DD
  track: string; // e.g. "CrossFit 18:00", "Open Box", "Teens"
  title: string; // optional-ish but keep as string for UI
  type: WodType;
  status: WodStatus;
  workout: string; // main wod text
  coachNotes?: string;
};

export const wodMock: WodMock[] = [
  {
    id: 1,
    date: "2026-01-01",
    track: "CrossFit 18:00",
    title: "New Year Burner",
    type: "metcon",
    status: "published",
    workout: "For time:\n21-15-9\nThrusters (40/30)\nPull-ups\n\nTime cap: 10:00",
    coachNotes: "Goal: fast transitions. Scale pull-ups to jumping/banded.",
  },
  {
    id: 2,
    date: "2026-01-01",
    track: "CrossFit 19:00",
    title: "Strength + Short Metcon",
    type: "strength",
    status: "published",
    workout: "A) Back Squat 5x3 (build)\n\nB) 8-min AMRAP:\n8 KB swings\n8 burpees",
    coachNotes: "Keep squat heavy but clean reps. AMRAP: steady pace.",
  },
  {
    id: 3,
    date: "2026-01-02",
    track: "Open Box",
    title: "Open Gym",
    type: "skill",
    status: "draft",
    workout: "Skill focus:\n- Double unders\n- Handstand holds\n\nOptional:\nRow 20 min Z2",
    coachNotes: "Let them choose skills. Keep it safe.",
  },
];
