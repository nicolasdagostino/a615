import React from "react";

type FilledRibbonProps = {
  label?: string;
  className?: string;
  ribbonClassName?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  children?: React.ReactNode;

  // ✅ NEW: solo renderiza la “chapita” (sin wrapper)
  badgeOnly?: boolean;
};

export default function FilledRibbon({
  label = "New",
  className = "",
  ribbonClassName = "bg-brand-500",
  position = "top-right",
  children,
  badgeOnly = false,
}: FilledRibbonProps) {
  const pos =
    position === "top-left"
      ? "left-4 top-4"
      : position === "top-right"
        ? "right-4 top-4"
        : position === "bottom-left"
          ? "left-4 bottom-4"
          : "right-4 bottom-4";

  const badge = (
    <span
      className={[
        "absolute z-10 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white shadow-theme-xs",
        pos,
        ribbonClassName,
      ].join(" ")}
    >
      {label}
    </span>
  );

  // ✅ Si lo uso como “badgeOnly”, NO meto wrapper (para que no rompa el layout)
  if (badgeOnly) return badge;

  return (
    <div
      className={[
        "relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]",
        className,
      ].join(" ")}
    >
      {badge}

      {children ? (
        children
      ) : (
        <div className="p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Lorem ipsum dolor sit amet consectetur. Eget nulla suscipit arcu rutrum amet vel nec.
          </p>
        </div>
      )}
    </div>
  );
}
