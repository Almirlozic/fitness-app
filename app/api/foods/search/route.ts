import type { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { OFF_ERROR_MESSAGE, searchOff } from "@/lib/off";

// GET /api/foods/search?q=skyr → { items: FoodChoice[] } eller { error } (502)
export async function GET(request: NextRequest) {
  if (!(await getUser())) {
    return Response.json({ error: "Ikke logget ind" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json({ items: [] });

  try {
    return Response.json({ items: await searchOff(q.slice(0, 100)) });
  } catch (error) {
    console.error("foods/search", error);
    return Response.json({ error: OFF_ERROR_MESSAGE }, { status: 502 });
  }
}
