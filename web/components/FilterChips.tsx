"use client";

import clsx from "clsx";

export interface ChipOption {
  value: string;
  label: string;
}

interface FilterChipsProps {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}

/**
 * Optional refinement chips (YouTube-style): a horizontally scrollable row,
 * active chip filled in gold. No pre-selection required — search is smart by
 * default and these just narrow it.
 */
export function FilterChips({
  options,
  value,
  onChange,
  ariaLabel,
}: FilterChipsProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={clsx(
              "flex-none whitespace-nowrap rounded-full border px-3.5 py-1.5 font-display text-[0.66rem] font-semibold uppercase tracking-[0.1em] outline-none transition-colors duration-200",
              active
                ? "border-transparent bg-gradient-to-b from-gold-bright to-gold-deep text-ink shadow-[0_4px_14px_-5px_rgba(230,180,80,0.7)]"
                : "border-line bg-surface/40 text-muted hover:border-gold/40 hover:text-bone",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
