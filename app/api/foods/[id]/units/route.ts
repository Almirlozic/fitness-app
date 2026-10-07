import { z } from "zod";
import { getUser } from "@/lib/auth";
import { getFoodUnits, getLastPortion } from "@/lib/foods";

// GET /api/foods/{id}/units → { units: FoodUnit[], last: LastPortion | null }
export async function GET(_request: Request, ctx: RouteContext<"/api/foods/[id]/units">) {
  if (!(await getUser())) {
    return Response.json({ error: "Ikke logget ind" }, { status: 401 });
  }

  const id = z.uuid().safeParse((await ctx.params).id);
  if (!id.success) return Response.json({ error: "Ukendt fødevare" }, { status: 400 });

  try {
    const [units, last] = await Promise.all([getFoodUnits(id.data), getLastPortion(id.data)]);
    return Response.json({ units, last });
  } catch (error) {
    console.error("foods/units", error);
    return Response.json({ error: "Kunne ikke hente enheder" }, { status: 500 });
  }
}
