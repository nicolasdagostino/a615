import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";

type Row = {
  id: number;
  name: string;
  sessions: number;
  target: 50 | 100;
};

const rows: Row[] = [
  { id: 1, name: "Zain Geidt", sessions: 48, target: 50 },
  { id: 2, name: "Miracle Bator", sessions: 96, target: 100 },
  { id: 3, name: "Lincoln Herwitz", sessions: 49, target: 50 },
  { id: 4, name: "Emery Culhane", sessions: 88, target: 100 },
];

export default function TrainingMilestones() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4 flex justify-between gap-2 sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Cerca de un hito (50/100)
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Para motivar y hacer shoutouts (mock).
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
                  Entrenos
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Hito
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Faltan
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((r) => {
                const left = r.target - r.sessions;
                const color = left <= 2 ? "warning" : "success";

                return (
                  <TableRow key={r.id}>
                    <TableCell className="py-3 text-gray-700 text-theme-sm dark:text-gray-400">
                      {r.name}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {r.sessions}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {r.target}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge size="sm" color={color}>
                        {left}
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
