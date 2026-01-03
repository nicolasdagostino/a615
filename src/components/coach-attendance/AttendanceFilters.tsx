"use client";

import { useMemo } from "react";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";

type Option = { value: string; label: string };

type Props = {
  date: string;
  classId: string;
  onDateChange: (value: string) => void;
  onClassChange: (value: string) => void;
};

const classesMock: Option[] = [
  { value: "c1", label: "CrossFit - 07:00 (Nico)" },
  { value: "c2", label: "CrossFit - 09:00 (Meli)" },
  { value: "c3", label: "Open Gym - 12:30" },
  { value: "c4", label: "CrossFit - 18:00 (Pablo)" },
  { value: "c5", label: "Endurance - 19:00 (Sofi)" },
];

export default function AttendanceFilters({
  date,
  classId,
  onDateChange,
  onClassChange,
}: Props) {
  const dateOptions = useMemo<Option[]>(() => {
    // mock simple: hoy + próximos 6 días
    const base = new Date();
    const out: Option[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const value = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("es-ES", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      });
      out.push({ value, label });
    }
    return out;
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <Label>Fecha</Label>
          <Select
            options={dateOptions}
            placeholder="Seleccionar fecha"
            defaultValue={date}
            onChange={onDateChange}
          />
        </div>

        <div>
          <Label>Clase</Label>
          <Select
            options={classesMock}
            placeholder="Seleccionar clase"
            defaultValue={classId}
            onChange={onClassChange}
          />
        </div>
      </div>
    </div>
  );
}
