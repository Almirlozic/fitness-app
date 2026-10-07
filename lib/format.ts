const NBSP = " ";
const TIME_ZONE = "Europe/Copenhagen";

const numberFormat = new Intl.NumberFormat("da-DK", { maximumFractionDigits: 2 });
const percentFormat = new Intl.NumberFormat("da-DK", { maximumFractionDigits: 1 });

/** 24.5 → "24,5" */
export function formatNumber(n: number) {
  return numberFormat.format(n);
}

/** 24.5 → "24,5 kg" */
export function formatKg(kg: number) {
  return `${formatNumber(kg)}${NBSP}kg`;
}

/** Med fortegn: 2 → "+2 kg", -2.5 → "−2,5 kg" */
export function formatSignedKg(kg: number) {
  return `${sign(kg)}${formatKg(Math.abs(kg))}`;
}

/** 26, 6 → "26 kg × 6" */
export function formatLift(weightKg: number, reps: number) {
  return `${formatKg(weightKg)} × ${reps}`;
}

/** 8.3 → "+8,3 %", 0 → "0 %" */
export function formatPercent(percent: number) {
  return `${sign(percent)}${percentFormat.format(Math.abs(percent))}${NBSP}%`;
}

function sign(n: number) {
  return n > 0 ? "+" : n < 0 ? "−" : "";
}

function parseIsoDate(iso: string) {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`);
}

/** "2026-10-12" → "12. okt 2026" */
export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("da-DK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(parseIsoDate(iso))
    .replace(/\.(?= \d{4}$)/, "");
}

/** "2026-10" eller "2026-10-12" → "oktober" */
export function formatMonthName(isoMonth: string) {
  return new Intl.DateTimeFormat("da-DK", { month: "long", timeZone: "UTC" }).format(
    parseIsoDate(`${isoMonth.slice(0, 7)}-01`),
  );
}

/** "2026-10" → "okt 26" (til grafakser) */
export function formatMonthShort(isoMonth: string) {
  const date = parseIsoDate(`${isoMonth.slice(0, 7)}-01`);
  const month = new Intl.DateTimeFormat("da-DK", { month: "short", timeZone: "UTC" })
    .format(date)
    .replace(".", "");
  return `${month} ${isoMonth.slice(2, 4)}`;
}

/** Dagens dato som "YYYY-MM-DD" i dansk tid */
export function todayIso(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

/** "2026-10-07" + 1 → "2026-10-08" (kalenderdage, uafhængigt af tidszone) */
export function addDays(isoDate: string, days: number) {
  const d = parseIsoDate(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isIsoDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    parseIsoDate(value).toISOString().slice(0, 10) === value
  );
}

/** "I dag", "I går" eller fx "Man. 5. okt" */
export function formatDayLabel(isoDate: string, today = todayIso()) {
  if (isoDate === today) return "I dag";
  if (isoDate === addDays(today, -1)) return "I går";
  const weekday = new Intl.DateTimeFormat("da-DK", { weekday: "short", timeZone: "UTC" }).format(
    parseIsoDate(isoDate),
  );
  const dayMonth = formatDate(isoDate).replace(/ \d{4}$/, "");
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${dayMonth}`;
}

