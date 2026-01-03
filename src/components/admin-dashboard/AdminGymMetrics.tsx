import Badge from "@/components/ui/badge/Badge";

const mockData = [
  { id: 1, title: "Miembros activos", value: "128", change: "+4", direction: "up", comparisonText: "vs semana pasada" },
  { id: 2, title: "Clases hoy", value: "6", change: "+1", direction: "up", comparisonText: "vs ayer" },
  { id: 3, title: "Reservas hoy", value: "84", change: "-3", direction: "down", comparisonText: "vs ayer" },
  { id: 4, title: "Pagos pendientes", value: "3", change: "+1", direction: "warning", comparisonText: "requiere atención" },
];

export default function AdminGymMetrics() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
      {mockData.map((item) => (
        <div
          key={item.id}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <p className="text-gray-500 text-theme-sm dark:text-gray-400">
            {item.title}
          </p>

          <div className="mt-3 flex items-end justify-between">
            <div>
              <h4 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                {item.value}
              </h4>
            </div>

            <div className="flex items-center gap-1">
              <Badge
                color={
                  item.direction === "up"
                    ? "success"
                    : item.direction === "down"
                    ? "error"
                    : "warning"
                }
              >
                <span className="text-xs">{item.change}</span>
              </Badge>
              <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                {item.comparisonText}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
