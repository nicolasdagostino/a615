import React from "react";

type RoundedRibbonProps = {
  label?: string;
  className?: string;
  ribbonClassName?: string;
  children?: React.ReactNode;
};

/**
 * RoundedRibbon (Template)
 * - Sin children: renderiza el demo original.
 * - Con children: actúa como wrapper (card) y muestra el ribbon con label.
 * - ribbonClassName permite cambiar el color (bg-*) del ribbon.
 */
export default function RoundedRibbon({
  label = "Popular",
  className = "",
  ribbonClassName = "bg-brand-500",
  children,
}: RoundedRibbonProps) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]",
        className,
      ].join(" ")}
    >
      <span
        className={[
          "absolute -left-px mt-3 inline-block rounded-r-full px-4 py-1.5 text-sm font-medium text-white",
          ribbonClassName,
        ].join(" ")}
      >
        {label}
      </span>

      {children ? (
        children
      ) : (
        <div className="p-5 pt-16">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Lorem ipsum dolor sit amet consectetur. Eget nulla suscipit arcu
            rutrum amet vel nec fringilla vulputate. Sed aliquam fringilla
            vulputate imperdiet arcu natoque purus ac nec ultricies nulla
            ultrices.
          </p>
        </div>
      )}
    </div>
  );
}
