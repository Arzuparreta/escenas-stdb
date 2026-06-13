import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5.2v13.6a1 1 0 0 0 1.52.85l11-6.8a1 1 0 0 0 0-1.7l-11-6.8A1 1 0 0 0 8 5.2Z" />
    </svg>
  );
}

export function ExternalIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 5h5v5" />
      <path d="M19 5 11 13" />
      <path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/** Quotation mark ornament for subtitle cards. */
export function QuoteGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M10 7c-3 1-5 3.6-5 7.2 0 2.4 1.5 3.8 3.4 3.8 1.7 0 3-1.2 3-3 0-1.7-1.2-2.9-2.8-2.9-.3 0-.6 0-.8.1.4-1.6 1.6-2.8 3.2-3.4L10 7Zm9 0c-3 1-5 3.6-5 7.2 0 2.4 1.5 3.8 3.4 3.8 1.7 0 3-1.2 3-3 0-1.7-1.2-2.9-2.8-2.9-.3 0-.6 0-.8.1.4-1.6 1.6-2.8 3.2-3.4L19 7Z" />
    </svg>
  );
}

/** Five-point western star ornament. */
export function StarGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="m12 2 2.7 6.2 6.8.6-5.1 4.5 1.5 6.6L12 17l-5.9 3.5 1.5-6.6L2.5 8.8l6.8-.6L12 2Z" />
    </svg>
  );
}

/** Logo mark: a film reel. */
export function ReelMark(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <circle cx="12" cy="12" r="9.2" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="5.6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.4" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="5.6" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18.4" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
