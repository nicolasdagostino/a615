"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type WodEntry = {
  date: string; // YYYY-MM-DD
  content: string; // un solo bloque de texto
};

export type WodComment = {
  id: string;
  date: string; // YYYY-MM-DD (a qué WOD pertenece)
  author: {
    name: string;
  };
  message: string;
  createdAt: string; // ISO
};

type WodState = {
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;

  wods: WodEntry[];
  getWodByDate: (date: string) => WodEntry | undefined;

  comments: WodComment[];
  getCommentsByDate: (date: string) => WodComment[];
  addComment: (date: string, message: string) => void;
};

const todayISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Mock inicial (después lo conectamos a backend)
const initialWods: WodEntry[] = [
  {
    date: todayISO(),
    content:
      "WOD del día\n\nFor time:\n21-15-9\nThrusters (40/30)\nPull-ups\n\nTime cap: 12:00",
  },
  {
    date: "2026-01-01",
    content:
      "WOD 01/01\n\nEMOM 12:\n1) 12 Cal Row\n2) 10 Burpees\n3) 12 KB Swings",
  },
];

const initialComments: WodComment[] = [
  {
    id: "c1",
    date: todayISO(),
    author: { name: "Lindsey Curtis" },
    message: "Durísimo hoy 😅",
    createdAt: new Date().toISOString(),
  },
  {
    id: "c2",
    date: todayISO(),
    author: { name: "Kaiya George" },
    message: "Me encantó el cap, llegué justita.",
    createdAt: new Date().toISOString(),
  },
];

const WodContext = createContext<WodState | null>(null);

export function WodProvider({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [wods] = useState<WodEntry[]>(initialWods);
  const [comments, setComments] = useState<WodComment[]>(initialComments);

  const getWodByDate = (date: string) => wods.find((w) => w.date === date);

  const getCommentsByDate = (date: string) =>
    comments
      .filter((c) => c.date === date)
      .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));

  const addComment = (date: string, message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const newComment: WodComment = {
      id: `c_${Date.now()}`,
      date,
      author: { name: "Tú" }, // mock: luego será el user real
      message: trimmed,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, newComment]);
  };

  const value = useMemo<WodState>(
    () => ({
      selectedDate,
      setSelectedDate,
      wods,
      getWodByDate,
      comments,
      getCommentsByDate,
      addComment,
    }),
    [selectedDate, wods, comments]
  );

  return <WodContext.Provider value={value}>{children}</WodContext.Provider>;
}

export function useWod() {
  const ctx = useContext(WodContext);
  if (!ctx) throw new Error("useWod must be used within a WodProvider");
  return ctx;
}
