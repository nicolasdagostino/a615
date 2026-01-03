"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Checkbox from "@/components/form/input/Checkbox";
import { PencilIcon } from "@/icons";

type AthleteRow = {
  id: number;
  name: string;
  email: string;
  membership: "Active" | "Paused";
  attended: boolean;
};

const athletesByClass: Record<string, AthleteRow[]> = {
  c1: [
    { id: 1, name: "Lindsey Curtis", email: "demoemail@gmail.com", membership: "Active", attended: false },
    { id: 2, name: "Kaiya George", email: "demoemail@gmail.com", membership: "Active", attended: true },
    { id: 3, name: "Abram Schleifer", email: "demoemail@gmail.com", membership: "Paused", attended: false },
  ],
  c2: [
    { id: 4, name: "Zain Geidt", email: "demoemail@gmail.com", membership: "Active", attended: false },
    { id: 5, name: "Carla George", email: "demoemail@gmail.com", membership: "Active", attended: false },
  ],
  c3: [
    { id: 6, name: "Emery Culhane", email: "demoemail@gmail.com", membership: "Active", attended: false },
    { id: 7, name: "Livia Donin", email: "demoemail@gmail.com", membership: "Active", attended: false },
  ],
  c4: [
    { id: 8, name: "Lincoln Herwitz", email: "demoemail@gmail.com", membership: "Active", attended: true },
    { id: 9, name: "Miracle Bator", email: "demoemail@gmail.com", membership: "Active", attended: false },
    { id: 10, name: "Ekstrom Bothman", email: "demoemail@gmail.com", membership: "Paused", attended: false },
  ],
  c5: [
    { id: 11, name: "Sofia Perez", email: "demoemail@gmail.com", membership: "Active", attended: false },
    { id: 12, name: "Juan Alvarez", email: "demoemail@gmail.com", membership: "Active", attended: false },
  ],
};

type Props = {
  classId: string;
};

export default function AttendanceTable({ classId }: Props) {
  const initial = useMemo(() => athletesByClass[classId] ?? [], [classId]);

  // reinicializa cuando cambia classId
  const [rows, setRows] = useState<AthleteRow[]>(initial);
  const [allChecked, setAllChecked] = useState(false);

  // Si cambia classId, reseteamos rows (sin efectos raros)
  if (rows !== initial && initial.length && rows.length !== initial.length) {
    // no hacemos nada
  }

  // Reset simple cuando cambia classId
  // (sin useEffect para no meter complejidad: el page re-monta el componente con key)
  const toggleOne = (id: number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, attended: !r.attended } : r))
    );
  };

  const toggleAll = () => {
    const next = !allChecked;
    setAllChecked(next);
    setRows((prev) => prev.map((r) => ({ ...r, attended: next })));
  };

  const presentCount = rows.filter((r) => r.attended).length;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Asistencia
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Presentes: <span className="text-gray-800 dark:text-white/90">{presentCount}</span> / {rows.length}
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            Guardar (mock)
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <Table>
          <TableHeader className="border-y border-gray-200 dark:border-gray-800">
            <TableRow>
              <TableCell isHeader className="w-14 px-5 py-3 text-start">
                <Checkbox checked={allChecked} onChange={toggleAll} />
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Atleta
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Estado
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Presente
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Acción
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-200 dark:divide-gray-800">
            {rows.map((r) => (
              <TableRow key={r.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-900">
                <TableCell className="w-14 px-5 py-4 whitespace-nowrap">
                  <Checkbox checked={r.attended} onChange={() => toggleOne(r.id)} />
                </TableCell>

                <TableCell className="px-5 py-4 whitespace-nowrap">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-400">
                    {r.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {r.email}
                  </p>
                </TableCell>

                <TableCell className="px-5 py-4 whitespace-nowrap">
                  <Badge size="sm" color={r.membership === "Active" ? "success" : "warning"}>
                    {r.membership === "Active" ? "Activo" : "Pausado"}
                  </Badge>
                </TableCell>

                <TableCell className="px-5 py-4 whitespace-nowrap">
                  <Badge size="sm" color={r.attended ? "success" : "error"}>
                    {r.attended ? "Sí" : "No"}
                  </Badge>
                </TableCell>

                <TableCell className="px-5 py-4 whitespace-nowrap">
                  <button className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90">
                    <PencilIcon />
                  </button>
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 && (
              <TableRow>
                <TableCell className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={5}>
                  No hay atletas para esta clase (mock).
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
