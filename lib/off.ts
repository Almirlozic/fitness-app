import "server-only";
import type { FoodChoice } from "./food-types";
import { type OffProduct, mapOffProduct } from "./off-map";

// Kald til Open Food Facts. Gratis og uden nøgle, men med lave grænser
// (ca. 15 produktopslag og 10 søgninger pr. minut pr. IP), så alt caches.

const TIMEOUT_MS = 4000;
const FIELDS = "code,product_name,product_name_da,product_name_en,brands,nutriments,serving_quantity";

export const OFF_ERROR_MESSAGE =
  "Kunne ikke hente fra Open Food Facts – prøv igen eller opret fødevaren selv";

export class OffError extends Error {}

function headers() {
  const contact = process.env.OFF_CONTACT_EMAIL ?? "ingen-kontakt-angivet";
  return { "User-Agent": `Loftebog/1.0 (${contact})`, Accept: "application/json" };
}

async function getJson(url: URL, revalidate: number) {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: headers(),
      next: { revalidate },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new OffError(`Netværksfejl eller timeout: ${String(error)}`);
  }
  return res;
}

/** Tekstsøgning via search.openfoodfacts.org (Search-a-licious). Caches i et døgn. */
export async function searchOff(query: string): Promise<FoodChoice[]> {
  const url = new URL("https://search.openfoodfacts.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("page_size", "20");
  url.searchParams.set("fields", FIELDS);

  const res = await getJson(url, 86400);
  if (!res.ok) throw new OffError(`Søgning svarede ${res.status}`);
  const data = (await res.json()) as { hits?: OffProduct[] };
  return (data.hits ?? []).flatMap((hit) => mapOffProduct(hit) ?? []);
}

/** Produktopslag på stregkode. null, hvis produktet ikke findes hos OFF. */
export async function fetchOffProduct(barcode: string): Promise<FoodChoice | null> {
  const url = new URL(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
  url.searchParams.set("fields", FIELDS);

  const res = await getJson(url, 86400);
  // Ukendte stregkoder giver 404 med status 0 – det er "ikke fundet", ikke en fejl
  if (res.status === 404) return null;
  if (!res.ok) throw new OffError(`Produktopslag svarede ${res.status}`);
  const data = (await res.json()) as { status?: number; product?: OffProduct };
  if (data.status !== 1 || !data.product) return null;
  return mapOffProduct({ ...data.product, code: data.product.code ?? barcode });
}
