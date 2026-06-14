"use client";

import { useEffect, useRef } from "react";

import { QuotedHighlightInput } from "@/components/QuotedHighlightInput";
import { CloseIcon, SearchIcon } from "@/components/icons";

interface FeedSearchProps {
  value: string;
  onChange: (value: string) => void;
  searching: boolean;
  compact?: boolean;
}

export function FeedSearch({
  value,
  onChange,
  searching,
  compact = false,
}: FeedSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if (event.key !== "/") return;
      const element = document.activeElement;
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        (element instanceof HTMLElement && element.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  return (
    <div
      className={`group relative flex items-center rounded-full border border-line bg-ink-2/90 shadow-lift backdrop-blur-xl transition-colors focus-within:border-gold/60 ${
        compact ? "gap-2 py-1.5 pl-4 pr-1.5" : "gap-3 py-2 pl-5 pr-2"
      }`}
    >
      <SearchIcon
        className={`${compact ? "h-4 w-4" : "h-5 w-5"} flex-none text-faint group-focus-within:text-gold`}
      />
      <QuotedHighlightInput
        ref={inputRef}
        value={value}
        onChange={onChange}
        placeholder="Busca una frase, película o director…"
        ariaLabel="Buscar escenas"
        highlight
      />
      {searching ? (
        <span
          aria-label="Buscando"
          className="mr-2 h-4 w-4 flex-none animate-spin rounded-full border-2 border-line border-t-gold"
        />
      ) : value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          className="grid h-8 w-8 flex-none place-items-center rounded-full text-faint transition-colors hover:bg-surface hover:text-bone"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      ) : (
        <span className="mr-2 hidden font-credit text-[0.52rem] text-faint sm:inline">
          /
        </span>
      )}
    </div>
  );
}
