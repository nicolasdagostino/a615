"use client";

import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { wodMock } from "./wodMock";

export default function CoachWodReadOnly() {
  const [date, setDate] = useState("2026-01-02");

  const rows = useMemo(() => wodMock.filter((w) => w.date === date), [date]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center dark:border-gray-800">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            WOD
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo lectura
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-400">
            Fecha
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <Table>
          <TableHeader className="border-y border-gray-200 dark:border-gray-800">
            <TableRow>
              <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Tipo
              </TableCell>
              <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Detalle
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-200 dark:divide-gray-800">
            {rows.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="px-5 py-4 whitespace-nowrap">
                  <Badge size="sm" color="success">
                    {w.title}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-4">
                  <p className="text-sm text-gray-700 dark:text-gray-400">
                    {w.notes ?? "-"}
                  </p>
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 && (
              <TableRow>
                <td colSpan={2} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  No hay WOD para esta fecha (mock).
                </td>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
