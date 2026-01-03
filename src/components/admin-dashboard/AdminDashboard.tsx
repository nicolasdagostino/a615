import AdminGymMetrics from "@/components/admin-dashboard/AdminGymMetrics";
import TodaysClasses from "@/components/admin-dashboard/TodaysClasses";
import UpcomingBirthdays from "@/components/admin-dashboard/UpcomingBirthdays";
import TrainingMilestones from "@/components/admin-dashboard/TrainingMilestones";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <AdminGymMetrics />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TodaysClasses />
        <UpcomingBirthdays />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TrainingMilestones />
        {/* si después querés, acá metemos “Alertas” o “Pagos vencidos” con el mismo estilo */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Alertas
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Espacio listo para: pagos vencidos, clases completas, etc. (mock).
          </p>
        </div>
      </div>
    </div>
  );
}
