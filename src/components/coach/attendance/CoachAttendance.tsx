"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Checkbox from "@/components/form/input/Checkbox";
import Button from "@/components/ui/button/Button";

type AttendanceStatus = "present" | "absent";

type AttendancePerson = {
  id: number;
  name: string;
  email: string;
  status: AttendanceStatus;
};

type CoachClass = {
  id: number;
  title: string;
  coach: string;
  time: string; // "18:00"
  capacity: number;
  people: AttendancePerson[];
};

const todayMock: CoachClass[] = [
  {
    id: 101,
    title: "CrossFit",
    coach: "Coach Nico",
    time: "08:00",
    capacity: 16,
    people: [
      { id: 1, name: "Lindsey Curtis", email: "demoemail@gmail.com", status: "present" },
      { id: 2, name: "Kaiya George", email: "demoemail@gmail.com", status: "absent" },
      { id: 3, name: "Zain Geidt", email: "demoemail@gmail.com", status: "present" },
    ],
  },
  {
    id: 102,
    title: "Gymnastic",
    coach: "Coach Nico",
    time: "18:00",
    capacity: 12,
    people: [
      { id: 4, name: "Abram Schleifer", email: "demoemail@gmail.com", status: "present" },
      { id: 5, name: "Carla George", email: "demoemail@gmail.com", status: "present" },
      { id: 6, name: "Emery Culhane", email: "demoemail@gmail.com", status: "absent" },
      { id: 7, name: "Livia Donin", email: "demoemail@gmail.com", status: "present" },
    ],
  },
];

function countPresent(people: AttendancePerson[]) {
  return people.filter((p) => p.status === "present").length;
}

export default function CoachAttendance() {
  const classes = useMemo(() => [...todayMock].sort((a, b) => a.time.localeCompare(b.time)), []);
  const [openId, setOpenId] = useState<number | null>(classes[0]?.id ?? null);

  // Local editable state (mock)
  const [data, setData] = useState<CoachClass[]>(classes);

  const openClass = data.find((c) => c.id === openId) ?? data[0];

  const togglePresent = (classId: number, personId: number) => {
    setData((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        return {
          ...c,
          people: c.people.map((p) => {
            if (p.id !== personId) return p;
            return { ...p, status: p.status === "present" ? "absent" : "present" };
          }),
        };
      })
    );
  };

  const handleSave = () => {
    // Mock: luego backend
    console.log("Attendance saved (mock)", data);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Asistencia (hoy)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Marcá quién vino y guardá. (Mock por ahora)
            </p>
          </div>

          <Button variant="primary" onClick={handleSave}>
            Guardar asistencia
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* LEFT: clases de hoy */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
            Clases de hoy
          </h3>

          <div className="space-y-2">
            {data.map((c) => {
              const present = countPresent(c.people);
              const total = c.people.length;
              const isActive = c.id === openId;

              return (
                <button
                  key={c.id}
                  onClick={() => setOpenId(c.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    isActive
                      ? "border-brand-300 bg-brand-50/50 dark:border-brand-800 dark:bg-white/[0.02]"
                      : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                          {c.time}
                        </span>
                        <Badge size="sm" color="info">
                          {c.title}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Coach: {c.coach}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Presentes
                      </p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                        {present}/{total}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: roster + check */}
        <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
                  {openClass?.title} · {openClass?.time}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {openClass?.people.length ?? 0} reservas · Capacidad {openClass?.capacity ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            {!openClass?.people?.length ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-800">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  No hay reservas en esta clase
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Cuando haya gente anotada, te aparece acá para marcar asistencia.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-12 gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                  <div className="col-span-6">Atleta</div>
                  <div className="col-span-4">Email</div>
                  <div className="col-span-2 text-right">Presente</div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {openClass.people.map((p) => (
                    <div key={p.id} className="grid grid-cols-12 items-center gap-3 px-4 py-4">
                      <div className="col-span-6">
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {p.name}
                        </p>
                      </div>
                      <div className="col-span-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {p.email}
                        </p>
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Checkbox
                          checked={p.status === "present"}
                          onChange={() => togglePresent(openClass.id, p.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
