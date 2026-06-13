import { statusMeta } from "@/lib/format";

/** Admission-ticket style status chip with notched edges. */
export function StatusTicket({ status }: { status: string }) {
  const meta = statusMeta(status);
  return (
    <span className="ticket" style={{ color: meta.color }}>
      <span className="dot" />
      <span style={{ color: "var(--color-bone-dim)" }}>{meta.label}</span>
    </span>
  );
}
