"use client";

import { forwardRef, useRef, type ReactNode } from "react";

interface QuotedHighlightInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
  /** When true, balanced "quoted" spans are tinted gold. */
  highlight: boolean;
}

// Splits on complete "quoted" pairs, keeping the delimiters.
const SPLIT_RE = /("[^"]+")/g;
const IS_QUOTED = /^"[^"]+"$/;

// Shared box/typography for input + mirror. Font size and line-height live on
// the WRAPPER (below) so both inherit identical metrics — Tailwind's responsive
// `sm:text-lg` applies to the <div> mirror but not the <input> (preflight resets
// form controls to `font: inherit`), which otherwise drifts the caret. text-left
// overrides the hero's inherited text-align:center.
const TYPO = "w-full bg-transparent py-2 text-left";

function renderMirror(value: string, highlight: boolean): ReactNode {
  if (!highlight || !value.includes('"')) return value;
  return value.split(SPLIT_RE).map((part, i) =>
    IS_QUOTED.test(part) ? (
      <span key={i} className="text-gold-bright quote-glow">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/**
 * Text input whose quoted phrases ("...") render in gold — a silent hint that
 * an exact-phrase search is in play. Implemented with a highlight mirror behind
 * a transparent-text input (only the caret shows through).
 */
export const QuotedHighlightInput = forwardRef<
  HTMLInputElement,
  QuotedHighlightInputProps
>(function QuotedHighlightInput(
  { value, onChange, placeholder, ariaLabel, highlight },
  ref,
) {
  const mirrorRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative min-w-0 flex-1 text-base leading-[1.5] sm:text-lg">
      <div
        ref={mirrorRef}
        aria-hidden="true"
        className={`${TYPO} pointer-events-none absolute inset-0 overflow-hidden whitespace-pre text-bone`}
      >
        {renderMirror(value, highlight)}
      </div>
      <input
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={(event) => {
          if (mirrorRef.current) {
            mirrorRef.current.scrollLeft = event.currentTarget.scrollLeft;
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`${TYPO} relative z-[1] text-transparent caret-bone placeholder:text-faint focus:outline-none`}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
      />
    </div>
  );
});
