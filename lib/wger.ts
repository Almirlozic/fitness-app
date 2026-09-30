import { type Category, categoryFromWger } from "./categories";

const TIMEOUT_MS = 4000;

/** Slår en wger-øvelses muskelgruppe op. Caches i et døgn; null ved fejl. */
export async function fetchWgerCategory(wgerId: number): Promise<Category | null> {
  try {
    const res = await fetch(`https://wger.de/api/v2/exerciseinfo/${wgerId}/`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { category?: { name?: string } };
    return categoryFromWger(data.category?.name);
  } catch {
    return null;
  }
}
