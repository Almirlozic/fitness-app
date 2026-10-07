import { getUser } from "@/lib/auth";
import { barcodeSchema } from "@/lib/food-schema";
import { resolveBarcode } from "@/lib/foods";
import { OFF_ERROR_MESSAGE } from "@/lib/off";

// GET /api/foods/barcode/5701211015703 → BarcodeResult eller { error }
export async function GET(_request: Request, ctx: RouteContext<"/api/foods/barcode/[code]">) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Ikke logget ind" }, { status: 401 });

  const parsed = barcodeSchema.safeParse((await ctx.params).code);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    return Response.json(await resolveBarcode(user.id, parsed.data));
  } catch (error) {
    console.error("foods/barcode", error);
    return Response.json({ error: OFF_ERROR_MESSAGE }, { status: 502 });
  }
}
