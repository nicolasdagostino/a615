import Badge from "@/components/ui/badge/Badge";

const mockData = [
  { id: 1, title: "Mis clases hoy", value: "3", change: "+1", direction: "up", comparisonText: "vs ayer" },
  { id: 2, title: "Reservas totales", value: "34", change: "+6", direction: "up", comparisonText: "vs ayer" },
  { id: 3, title: "Asistencia pendiente", value: "2", change: "+1", direction: "warning", comparisonText: "faltan pasar lista" },
  { id: 4, title: "WODs publicados hoy", value: "1", change: "OK", direction: "success", comparisonText: "estado" },
];

export default function CoachMetrics() {
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
                    : item.direction === "success"
                    ? "success"
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
