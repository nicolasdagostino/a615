import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";

type Row = {
  id: number;
  time: string;
  name: string;
  booked: number;
  capacity: number;
  attendanceDone: boolean;
};

const rows: Row[] = [
  { id: 1, time: "07:00", name: "CrossFit", booked: 10, capacity: 12, attendanceDone: true },
  { id: 2, time: "18:00", name: "CrossFit", booked: 11, capacity: 12, attendanceDone: false },
  { id: 3, time: "19:00", name: "Endurance", booked: 13, capacity: 14, attendanceDone: false },
];

export default function TodaysCoachClasses() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Mis clases de hoy
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Resumen rápido (mock).
        </p>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-full">
          <Table>
            <TableHeader className="border-y border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Hora
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Clase
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Cupos
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Asistencia
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((r) => {
                const ratio = r.booked / r.capacity;
                const isFull = r.booked >= r.capacity;

                return (
                  <TableRow key={r.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-900">
                    <TableCell className="py-3 text-gray-700 text-theme-sm dark:text-gray-400">
                      {r.time}
                    </TableCell>
                    <TableCell className="py-3 text-gray-700 text-theme-sm dark:text-gray-400">
                      {r.name}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <Badge size="sm" color={isFull ? "error" : ratio >= 0.8 ? "warning" : "success"}>
                        {r.booked}/{r.capacity}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge size="sm" color={r.attendanceDone ? "success" : "warning"}>
                        {r.attendanceDone ? "Hecha" : "Pendiente"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
