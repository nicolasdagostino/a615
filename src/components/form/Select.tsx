import { ChevronDownIcon } from "@/icons";
import React, { useEffect, useMemo, useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;

  /**
   * Uncontrolled initial value (legacy support)
   * If you pass `value`, `defaultValue` is ignored.
   */
  defaultValue?: string;

  /**
   * Controlled value.
   * When provided, the Select becomes controlled and will always reflect this prop.
   */
  value?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
  value,
}) => {
  const isControlled = value !== undefined;

  // Internal state only used when uncontrolled
  const [internalValue, setInternalValue] = useState<string>(defaultValue);

  // Keep internal state in sync if defaultValue changes (uncontrolled mode)
  useEffect(() => {
    if (!isControlled) setInternalValue(defaultValue || "");
  }, [defaultValue, isControlled]);

  const selectedValue = isControlled ? String(value ?? "") : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;

    if (!isControlled) setInternalValue(next);
    onChange(next);
  };

  const hasValue = useMemo(() => Boolean((selectedValue || "").trim()), [selectedValue]);

  return (
    <div className="relative">
      <select
        className={`h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
          hasValue ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"
        } ${className}`}
        value={selectedValue}
        onChange={handleChange}
      >
        <option value="" disabled className="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
          >
            {option.label}
          </option>
        ))}
      </select>

      <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
        <ChevronDownIcon />
      </span>
    </div>
  );
};

export default Select;
