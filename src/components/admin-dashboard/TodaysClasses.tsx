import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";

type Row = {
  id: number;
  time: string;
  name: string;
  coach: string;
  booked: number;
  capacity: number;
};

const rows: Row[] = [
  { id: 1, time: "07:00", name: "CrossFit", coach: "Nico", booked: 10, capacity: 12 },
  { id: 2, time: "09:00", name: "CrossFit", coach: "Meli", booked: 12, capacity: 12 },
  { id: 3, time: "12:30", name: "Open Gym", coach: "—", booked: 7, capacity: 20 },
  { id: 4, time: "18:00", name: "CrossFit", coach: "Pablo", booked: 11, capacity: 12 },
  { id: 5, time: "19:00", name: "Endurance", coach: "Sofi", booked: 8, capacity: 12 },
];

export default function TodaysClasses() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4 flex justify-between gap-2 sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Clases de hoy
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Resumen rápido por horario (mock).
          </p>
        </div>
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
                  Coach
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Cupos
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Estado
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((r) => {
                const isFull = r.booked >= r.capacity;
                const ratio = r.booked / r.capacity;

                return (
                  <TableRow key={r.id}>
                    <TableCell className="py-3 text-gray-700 text-theme-sm dark:text-gray-400">
                      {r.time}
                    </TableCell>
                    <TableCell className="py-3 text-gray-700 text-theme-sm dark:text-gray-400">
                      {r.name}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {r.coach}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {r.booked}/{r.capacity}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        size="sm"
                        color={isFull ? "error" : ratio >= 0.8 ? "warning" : "success"}
                      >
                        {isFull ? "FULL" : ratio >= 0.8 ? "Casi llena" : "OK"}
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
