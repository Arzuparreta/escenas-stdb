import { StarGlyph } from "@/components/icons";

/** End-credits style footer. */
export function CreditsFooter() {
  return (
    <footer className="relative z-10 mt-24 border-t border-line-soft">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-5 py-12 text-center">
        <div className="flex items-center gap-3 text-faint">
          <span className="h-px w-10 bg-line" />
          <StarGlyph className="h-3 w-3 text-gold-deep" />
          <span className="h-px w-10 bg-line" />
        </div>
        <p className="font-credit text-[0.62rem] text-muted">Fin</p>
        <p className="max-w-md text-sm leading-relaxed text-faint">
          Un archivo curado a mano. Las escenas se añaden en una lista de YouTube
          y se indexan solas — frase a frase.
        </p>
        <p className="font-credit text-[0.58rem] text-faint/80">
          Curado a mano · Indexado automáticamente · stdbKit
        </p>
      </div>
    </footer>
  );
}
