import Badge from "@/components/ui/badge/Badge";

export default function WodTodayCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            WOD de hoy
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mock para que el coach lo vea rápido.
          </p>
        </div>

        <Badge color="success">Publicado</Badge>
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/30">
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            WOD A
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            12' AMRAP: 10 burpees + 12 wall balls + 200m run
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/30">
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            WOD B
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Strength: Back squat 5x5 (mock)
          </p>
        </div>
      </div>
    </div>
  );
}
