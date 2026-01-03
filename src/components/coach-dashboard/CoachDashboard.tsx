import CoachMetrics from "@/components/coach-dashboard/CoachMetrics";
import TodaysCoachClasses from "@/components/coach-dashboard/TodaysCoachClasses";
import WodTodayCard from "@/components/coach-dashboard/WodTodayCard";
import CoachAlerts from "@/components/coach-dashboard/CoachAlerts";

export default function CoachDashboard() {
  return (
    <div className="space-y-6">
      <CoachMetrics />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TodaysCoachClasses />
        <WodTodayCard />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CoachAlerts />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Notas del día
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Placeholder (mock). Después acá podemos poner “lesiones”, “escala recomendada”, etc.
          </p>
        </div>
      </div>
    </div>
  );
}
