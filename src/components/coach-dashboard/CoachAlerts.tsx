import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";

type Row = {
  id: number;
  title: string;
  detail: string;
  level: "warning" | "error" | "success";
};

const rows: Row[] = [
  { id: 1, title: "Asistencia pendiente", detail: "CrossFit 18:00", level: "warning" },
  { id: 2, title: "Clase casi llena", detail: "Endurance 19:00 (13/14)", level: "warning" },
  { id: 3, title: "WOD publicado", detail: "WOD A + B", level: "success" },
];

export default function CoachAlerts() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Alertas
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Cosas que el coach tiene que ver rápido (mock).
        </p>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-full">
          <Table>
            <TableHeader className="border-y border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Tipo
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Detalle
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Estado
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((r) => (
                <TableRow key={r.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-900">
                  <TableCell className="py-3 text-gray-700 text-theme-sm dark:text-gray-400">
                    {r.title}
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {r.detail}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge size="sm" color={r.level === "error" ? "error" : r.level === "warning" ? "warning" : "success"}>
                      {r.level === "error" ? "Urgente" : r.level === "warning" ? "Atención" : "OK"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
