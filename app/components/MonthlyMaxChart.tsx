"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatKg, formatMonthShort, formatNumber } from "@/lib/format";
import type { MonthlyMax } from "@/lib/progression";

const tick = { fontFamily: "var(--font-space-mono)", fontSize: 10, fill: "#5e5e5d" };

export function MonthlyMaxChart({ data }: { data: MonthlyMax[] }) {
  return (
    <section className="mt-space-xl" aria-labelledby="chart-heading">
      <div className="flex items-center justify-between gap-space-md border-b border-primary pb-space-xs">
        <h2 id="chart-heading" className="text-label-caps uppercase tracking-widest text-primary">
          [ Tungeste kg pr. måned ]
        </h2>
        <span className="font-mono text-caption-mono uppercase text-secondary">
          [ {data.length} {data.length === 1 ? "måned" : "måneder"} ]
        </span>
      </div>

      {data.length < 2 ? (
        <p className="py-space-lg text-center font-mono text-caption-mono uppercase text-secondary">
          Grafen vises, når du har logget i mindst to måneder
        </p>
      ) : (
        <div
          className="mt-space-md h-48 w-full"
          role="img"
          aria-label={data.map((d) => `${formatMonthShort(d.month)}: ${formatKg(d.maxKg)}`).join(", ")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#e8e8e8" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonthShort}
                tick={tick}
                tickLine={false}
                axisLine={{ stroke: "#000" }}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                tick={tick}
                tickLine={false}
                axisLine={false}
                width={48}
                domain={["auto", "auto"]}
                tickFormatter={(v: number) => formatNumber(v)}
              />
              <Tooltip
                formatter={(v) => [formatKg(Number(v)), "Max"]}
                labelFormatter={(m) => formatMonthShort(String(m))}
                contentStyle={{
                  border: "1px solid #000",
                  borderRadius: 0,
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 11,
                }}
              />
              <Line
                type="linear"
                dataKey="maxKg"
                stroke="#000"
                strokeWidth={1.5}
                dot={{ r: 2.5, fill: "#000", strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
