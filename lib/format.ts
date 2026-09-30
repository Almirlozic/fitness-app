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
