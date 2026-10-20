// Halvcirkel-måleren fra designet: hvid bue (176 × 86, 4 px streg) og grøn
// fremgang fra venstre. Bueformen er designets egen sti, vendt så den starter til venstre.
const ARC =
  "M2 86C2 63.7218 11.0607 42.3561 27.1888 26.603C43.317 10.85 65.1914 2 88 2C110.809 2 132.683 10.85 148.811 26.603C164.939 42.3561 174 63.7218 174 86";

export function KcalGauge({ fraction, label }: { fraction: number; label: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, fraction)) * 1000) / 10;
  return (
    <svg viewBox="0 0 176 86" width={176} height={86} role="img" aria-label={label} className="block">
      <path d={ARC} stroke="#FFFCF3" strokeWidth="4" fill="none" />
      {pct > 0 && (
        <path
          d={ARC}
          stroke="#417A27"
          strokeWidth="4"
          fill="none"
          pathLength={100}
          strokeDasharray={`${pct} 100`}
        />
      )}
    </svg>
  );
}
