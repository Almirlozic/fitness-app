import { formatKg, formatMonthShort } from "@/lib/format";
import type { MonthlyMax } from "@/lib/progression";

// Samme geometri som "line-chart" i Figma-designet: 300 × 96, tre hjælpelinjer
// (y = 16, 48, 80) fra x = 16 til 296, en blød kurve og prikker på datapunkterne.
const W = 300;
const H = 96;
const LEFT = 16;
const RIGHT = 296;
const TOP = 16;
const BOTTOM = 80;

/** Tungeste kg pr. måned som en blød kurve */
export function StrengthChart({
  data,
  color = "#24201D",
  id = "strength-chart",
}: {
  data: MonthlyMax[];
  /** Forsiden bruger #24201D, progression-siden #2C3240 (som i designet) */
  color?: string;
  /** Unikt id, når der er flere grafer på samme side */
  id?: string;
}) {
  const INK = color;
  const values = data.map((d) => d.maxKg);
  const min = Math.min(...values);
  const range = Math.max(...values) - min;
  const points = data.map((d, i) => ({
    x: data.length === 1 ? RIGHT : LEFT + (i / (data.length - 1)) * (RIGHT - LEFT),
    // Ens værdier lægges på midterlinjen
    y: range === 0 ? (TOP + BOTTOM) / 2 : BOTTOM - ((d.maxKg - min) / range) * (BOTTOM - TOP),
  }));

  // Vandrette kontrolpunkter midt mellem punkterne giver den bløde kurve fra designet
  const path = points
    .map((p, i) => {
      if (i === 0) return `M${p.x} ${p.y}`;
      const prev = points[i - 1];
      const mid = (prev.x + p.x) / 2;
      return `C${mid} ${prev.y} ${mid} ${p.y} ${p.x} ${p.y}`;
    })
    .join("");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      className="h-auto w-full"
      role="img"
      aria-label={
        data.length === 0
          ? "Ingen data endnu"
          : `Tungeste kg pr. måned: ${data.map((d) => `${formatMonthShort(d.month)} ${formatKg(d.maxKg)}`).join(", ")}`
      }
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect width={W} height={H} rx="12" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        {[TOP, 48, BOTTOM].map((y) => (
          <rect key={y} x={LEFT} y={y} width={RIGHT - LEFT} height="1" fill={INK} />
        ))}
        {points.length > 1 && <path d={path} stroke={INK} strokeLinecap="round" fill="none" />}
        {points.length > 1 &&
          points.map((p, i) => <circle key={data[i].month} cx={p.x} cy={p.y} r="4" fill={INK} />)}
      </g>
      {points.length < 2 && (
        <text
          x={W / 2}
          y={36}
          textAnchor="middle"
          className="font-inter"
          fontSize="12"
          fontWeight="600"
          fill={INK}
        >
          <tspan x={W / 2} dy="0">
            {points.length === 0 ? "Ingen sæt endnu" : "Din kurve vises, når du har"}
          </tspan>
          <tspan x={W / 2} dy="32">
            {points.length === 0 ? "Log et sæt for at se din kurve" : "logget i mindst to måneder"}
          </tspan>
        </text>
      )}
      <rect x="0.25" y="0.25" width={W - 0.5} height={H - 0.5} rx="11.75" stroke={INK} strokeWidth="0.5" fill="none" />
    </svg>
  );
}
