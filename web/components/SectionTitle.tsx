import type { ReactNode } from "react";

import { StarGlyph } from "@/components/icons";

interface SectionTitleProps {
  title: string;
  /** Optional right-aligned meta (count, controls…). */
  meta?: ReactNode;
}

/** Credit-style section heading with a hairline rule. */
export function SectionTitle({ title, meta }: SectionTitleProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex flex-none items-center gap-3">
        <StarGlyph className="h-3.5 w-3.5 flex-none text-gold-deep" />
        <h2 className="font-credit text-sm text-bone">{title}</h2>
      </div>
      <span className="hidden h-px flex-1 bg-gradient-to-r from-line to-transparent sm:block" />
      {meta ? <div className="flex-none">{meta}</div> : null}
    </div>
  );
}
