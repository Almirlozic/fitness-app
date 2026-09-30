import type { NextRequest } from "next/server";

export type WgerExercise = { id: number; name: string; category: string };

// wger's gamle /exercise/search/ findes ikke længere (404). exerciseinfo
// kan søge på navn og giver kategori og oversættelser i samme svar.
const WGER_URL = "https://wger.de/api/v2/exerciseinfo/";
const ENGLISH = 2;
const TIMEOUT_MS = 4000;

type WgerExerciseInfo = {
  id: number;
  category?: { name?: string };
  translations?: { name?: string; language?: number }[];
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json([]);

  const url = new URL(WGER_URL);
  url.searchParams.set("name__search", q);
  url.searchParams.set("language", String(ENGLISH));
  url.searchParams.set("limit", "10");

  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return Response.json([]);

    const data = (await res.json()) as { results?: WgerExerciseInfo[] };
    const exercises: WgerExercise[] = (data.results ?? []).flatMap((ex) => {
      const name = ex.translations
        ?.find((t) => t.language === ENGLISH)
        ?.name?.trim()
        .replace(/\s+/g, " ");
      return name ? [{ id: ex.id, name, category: ex.category?.name ?? "" }] : [];
    });

    return Response.json(exercises);
  } catch {
    // Timeout, netværksfejl eller uventet svar: vis bare ingen forslag
    return Response.json([]);
  }
}
