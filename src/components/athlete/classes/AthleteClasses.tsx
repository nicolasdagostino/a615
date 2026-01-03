"use client";

import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { classesMock } from "./classesMock";
import type { AthleteClassRow } from "./classesMock";
import { useReservations } from "../reservations/reservationsStore";
import { useState } from "react";

export default function AthleteClasses() {
  const { reserve, isReserved } = useReservations();
  const reserveModal = useModal();
  const [target, setTarget] = useState<AthleteClassRow | null>(null);

  const openReserve = (row: AthleteClassRow) => {
    setTarget(row);
    reserveModal.openModal();
  };

  const confirmReserve = () => {
    if (!target) return;
    reserve(target.id);
    reserveModal.closeModal();
    setTarget(null);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col justify-between gap-5 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center dark:border-gray-800">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Clases
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Elegí una clase y reservate (mock).
          </p>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <Table>
          <TableHeader className="border-y border-gray-200 dark:border-gray-800">
            <TableRow>
              <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Clase
              </TableCell>
              <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Coach
              </TableCell>
              <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Día
              </TableCell>
              <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Hora
              </TableCell>
              <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Cupo
              </TableCell>
              <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Estado
              </TableCell>
              <TableCell isHeader className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Acción
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-200 dark:divide-gray-800">
            {classesMock.map((row) => {
              const reserved = isReserved(row.id);
              return (
                <TableRow key={row.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-900">
                  <TableCell className="px-5 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-400">
                      {row.name}
                    </p>
                  </TableCell>

                  <TableCell className="px-5 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {row.coach}
                    </p>
                  </TableCell>

                  <TableCell className="px-5 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {row.day}
                    </p>
                  </TableCell>

                  <TableCell className="px-5 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {row.time}
                    </p>
                  </TableCell>

                  <TableCell className="px-5 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-700 dark:text-gray-400">
                      {row.capacity}
                    </p>
                  </TableCell>

                  <TableCell className="px-5 py-4 whitespace-nowrap">
                    <Badge size="sm" color={reserved ? "success" : "warning"}>
                      {reserved ? "Reservado" : "Disponible"}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-5 py-4 whitespace-nowrap">
                    <Button
                      size="sm"
                      variant={reserved ? "outline" : "primary"}
                      onClick={() => openReserve(row)}
                      disabled={reserved}
                    >
                      {reserved ? "Ya estás" : "Reservarme"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={reserveModal.isOpen}
        onClose={reserveModal.closeModal}
        className="max-w-[600px] p-5 lg:p-10"
      >
        <div className="text-center">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-title-sm">
            Confirmar reserva
          </h4>

          {target && (
            <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
              ¿Querés reservarte en <span className="font-semibold text-gray-800 dark:text-white/90">{target.name}</span>{" "}
              · {target.day} · {target.time}?
            </p>
          )}

          <div className="mt-7 flex w-full items-center justify-center gap-3">
            <button
              type="button"
              onClick={reserveModal.closeModal}
              className="flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/5"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={confirmReserve}
              className="flex justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
