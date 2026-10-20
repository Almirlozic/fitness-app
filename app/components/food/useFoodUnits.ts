"use client";

import { useEffect, useState } from "react";
import type { FoodUnit, LastPortion } from "@/lib/food-types";

type UnitsState =
  | { status: "loading" }
  | { status: "ready"; units: FoodUnit[]; last: LastPortion | null }
  | { status: "error" };

/**
 * Henter varens enheder og det, brugeren loggede sidst. For varer uden id
 * (ikke gemt i databasen) er der ingen enheder.
 */
export function useFoodUnits(foodId: string | null) {
  const [state, setState] = useState<UnitsState>(
    foodId ? { status: "loading" } : { status: "ready", units: [], last: null },
  );

  useEffect(() => {
    if (!foodId) return;
    const controller = new AbortController();
    fetch(`/api/foods/${foodId}/units`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { units: FoodUnit[]; last: LastPortion | null }) =>
        setState({ status: "ready", units: data.units, last: data.last }),
      )
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "error" });
      });
    return () => controller.abort();
  }, [foodId]);

  const addUnit = (unit: FoodUnit) =>
    setState((s) =>
      s.status === "ready" ? { ...s, units: [...s.units.filter((u) => u.id !== unit.id), unit] } : s,
    );

  return { state, addUnit };
}
