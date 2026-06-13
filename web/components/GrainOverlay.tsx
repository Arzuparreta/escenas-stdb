/** Full-viewport film grain + vignette. Purely decorative. */
export function GrainOverlay() {
  return (
    <>
      <div className="fx-backdrop" aria-hidden="true" />
      <div className="fx-grain" aria-hidden="true" />
      <div className="fx-vignette" aria-hidden="true" />
    </>
  );
}
