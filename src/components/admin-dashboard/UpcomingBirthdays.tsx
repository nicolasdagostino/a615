import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";

type Row = {
  id: number;
  name: string;
  dateLabel: string;
  daysLeft: number;
};

const rows: Row[] = [
  { id: 1, name: "Lindsey Curtis", dateLabel: "04 Ene", daysLeft: 2 },
  { id: 2, name: "Kaiya George", dateLabel: "06 Ene", daysLeft: 4 },
  { id: 3, name: "Abram Schleifer", dateLabel: "10 Ene", daysLeft: 8 },
  { id: 4, name: "Carla George", dateLabel: "15 Ene", daysLeft: 13 },
];

export default function UpcomingBirthdays() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4 flex justify-between gap-2 sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Próximos cumpleaños
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Para saludar y sumar engagement (mock).
          </p>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-full">
          <Table>
            <TableHeader className="border-y border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Miembro
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Fecha
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  En
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="py-3 text-gray-700 text-theme-sm dark:text-gray-400">
                    {r.name}
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {r.dateLabel}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge size="sm" color={r.daysLeft <= 3 ? "warning" : "success"}>
                      {r.daysLeft} días
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
