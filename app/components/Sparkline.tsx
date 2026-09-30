const WIDTH = 120;
const HEIGHT = 24;
const PADDING = 2;

/** Lille linjegraf over vægthistorik. Første punkt til venstre, seneste til højre. */
export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const points = values.map((v, i) => ({
    x: (i / (values.length - 1)) * WIDTH,
    y: HEIGHT - PADDING - ((v - min) / range) * (HEIGHT - PADDING * 2),
  }));

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-6 w-24 shrink-0 overflow-visible text-primary min-[400px]:w-32"
      role="img"
      aria-label={`Udvikling: ${values.join(" → ")} kg`}
    >
      <polyline
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 2.5 : 2}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
