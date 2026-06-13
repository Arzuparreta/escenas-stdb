"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { QuotedHighlightInput } from "@/components/QuotedHighlightInput";
import { SearchIcon } from "@/components/icons";

const EXAMPLES: { q: string; label: string }[] = [
  { q: '"I\'ll be back"', label: "“I'll be back”" },
  { q: "El Padrino", label: "El Padrino" },
  { q: "Coppola", label: "Coppola" },
  { q: "no soy malo", label: "no soy malo" },
];

interface SearchConsoleProps {
  /** Search is smart by default; `exact` is derived from quotes, not a toggle. */
  onSearch: (query: string, exact: boolean) => void;
  loading: boolean;
}

/**
 * Exact-phrase search is passive: wrap the query in quotes and we search the
 * literal phrase. No toggle, no banner — the gold tint on quoted text is the
 * only (deliberately cryptic) hint.
 */
function parseQuery(raw: string): { text: string; exact: boolean } {
  const trimmed = raw.trim();
  const quoted = trimmed.match(/^"([^"]+)"$/);
  if (quoted) return { text: quoted[1].trim(), exact: true };
  return { text: trimmed, exact: false };
}

export function SearchConsole({ onSearch, loading }: SearchConsoleProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" focuses the search from anywhere.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/") return;
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable);
      if (typing) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    const { text, exact } = parseQuery(query);
    if (!text) return;
    onSearch(text, exact);
  }

  function runExample(example: (typeof EXAMPLES)[number]) {
    setQuery(example.q);
    const { text, exact } = parseQuery(example.q);
    onSearch(text, exact);
  }

  return (
    <form onSubmit={submit} className="w-full">
      {/* Search pill */}
      <div className="group relative flex items-center gap-2 rounded-full border border-line bg-ink-2/80 py-2 pl-5 pr-2 shadow-frame backdrop-blur-sm transition-colors duration-300 focus-within:border-gold/55">
        <SearchIcon className="h-5 w-5 flex-none text-faint transition-colors group-focus-within:text-gold" />
        <QuotedHighlightInput
          ref={inputRef}
          value={query}
          onChange={setQuery}
          placeholder="Busca una frase, una película, un director…"
          ariaLabel="Buscar escenas"
          highlight
        />
        <span className="mr-1 hidden text-[0.6rem] text-faint sm:inline">
          <kbd className="rounded border border-line px-1.5 py-0.5 font-credit">/</kbd>
        </span>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex-none rounded-full bg-gradient-to-b from-gold-bright to-gold-deep px-5 py-2.5 font-credit text-[0.66rem] text-ink shadow-[0_4px_16px_-6px_rgba(230,180,80,0.7)] transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
        >
          {loading ? "Buscando…" : "Buscar"}
        </button>
      </div>

      {/* Example chips */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="font-credit text-[0.56rem] text-faint">Prueba</span>
        {EXAMPLES.map((example) => (
          <button
            key={example.label}
            type="button"
            onClick={() => runExample(example)}
            className="rounded-full border border-line-soft bg-surface/50 px-3 py-1 text-xs text-bone-dim transition-colors duration-200 hover:border-gold/40 hover:text-gold-bright"
          >
            {example.label}
          </button>
        ))}
      </div>
    </form>
  );
}
