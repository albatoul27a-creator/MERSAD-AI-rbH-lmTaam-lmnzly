export type Unit = "kg" | "g" | "l" | "ml" | "piece";

const units: Record<Unit, { group: string; factor: number }> = {
  kg: { group: "weight", factor: 1000 },
  g: { group: "weight", factor: 1 },
  l: { group: "volume", factor: 1000 },
  ml: { group: "volume", factor: 1 },
  piece: { group: "count", factor: 1 },
};

export function compatibleUnits(a: Unit, b: Unit): boolean {
  return units[a].group === units[b].group;
}

/** Quantities are net edible amounts; waste is the fraction lost from purchased stock. */
export function ingredientLineCost(
  priceFils: number, purchaseUnit: Unit, quantity: number, recipeUnit: Unit, wastePercent: number,
): number {
  if (!compatibleUnits(purchaseUnit, recipeUnit)) throw new Error("Incompatible units");
  if (!Number.isFinite(quantity) || quantity <= 0 || wastePercent < 0 || wastePercent >= 100 || priceFils <= 0) {
    throw new Error("Invalid recipe cost input");
  }
  const purchaseQuantity = quantity * units[recipeUnit].factor / units[purchaseUnit].factor;
  return Math.round(priceFils * purchaseQuantity / (1 - wastePercent / 100));
}

export function channelProfit(costFils: number, priceFils: number, commissionPercent: number, fixedFeeFils: number) {
  if (commissionPercent < 0 || commissionPercent >= 100 || priceFils <= 0 || costFils < 0 || fixedFeeFils < 0) {
    throw new Error("Invalid channel cost input");
  }
  const commissionFils = Math.round(priceFils * commissionPercent / 100);
  const netFils = priceFils - commissionFils - fixedFeeFils;
  const profitFils = netFils - costFils;
  const roundPercent = (value: number) => Math.round(value * 10) / 10;
  // ceil ensures an advertised price never understates the required minimum.
  const requiredPrice = (margin: number) => {
    const raw = (costFils + fixedFeeFils) / (1 - commissionPercent / 100 - margin);
    let candidate = Math.max(1, Math.ceil(raw - Number.EPSILON * raw * 8));
    while (candidate - Math.round(candidate * commissionPercent / 100) - fixedFeeFils - costFils + 1e-8 < candidate * margin) {
      candidate += 1;
    }
    return candidate;
  };
  const breakEvenFils = requiredPrice(0);
  const targetDenominator = 1 - commissionPercent / 100 - 0.2;
  const suggestedFils = targetDenominator > 0.000001
    ? requiredPrice(0.2) : null;
  return {
    sellingPrice: priceFils / 1000,
    commission: commissionFils / 1000,
    fixedFee: fixedFeeFils / 1000,
    netRevenue: netFils / 1000,
    profit: profitFils / 1000,
    marginPercent: roundPercent(profitFils / priceFils * 100),
    breakEvenPrice: breakEvenFils / 1000,
    suggestedPrice: suggestedFils === null ? null : suggestedFils / 1000,
  };
}
