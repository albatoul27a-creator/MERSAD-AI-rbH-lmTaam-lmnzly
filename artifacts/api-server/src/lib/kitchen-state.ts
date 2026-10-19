import { db, deliveryChannels, dishChannelPrices, ingredientPriceHistory, kitchenDishes, kitchenIngredients, recipeItems } from "@workspace/db";
import { desc } from "drizzle-orm";
import { GetKitchenStateResponse } from "@workspace/api-zod";
import { channelProfit, ingredientLineCost } from "./costing";

type Alert = {
  id: string; kind: "loss" | "price_increase" | "pricing"; severity: "danger" | "warning" | "info";
  title: string; message: string; dishId: number | null; ingredientId: number | null;
};

export async function getKitchenSnapshot() {
  // One consistent snapshot: an ingredient price edit cannot split recipe and alert calculations.
  return db.transaction(async (tx) => {
    const ingredientRows = await tx.select().from(kitchenIngredients).orderBy(kitchenIngredients.id);
    const dishRows = await tx.select().from(kitchenDishes).orderBy(kitchenDishes.id);
    const items = await tx.select().from(recipeItems);
    const channelRows = await tx.select().from(deliveryChannels).orderBy(deliveryChannels.id);
    const overrides = await tx.select().from(dishChannelPrices);
    const history = await tx.select().from(ingredientPriceHistory).orderBy(desc(ingredientPriceHistory.id));
    const channels = channelRows.map((c) => ({
      id: c.id, key: c.key, name: c.name, commissionPercent: c.commissionPercent, fixedFee: c.fixedFeeFils / 1000,
    }));
    const ingredients = ingredientRows.map((i) => {
      const lastChange = history.find((h) => h.ingredientId === i.id && h.unit === i.unit);
      return {
        id: i.id, name: i.name, price: i.priceFils / 1000, unit: i.unit, wastePercent: i.wastePercent,
        previousPrice: lastChange ? lastChange.oldPriceFils / 1000 : null,
        priceChangePercent: lastChange ? Math.round((i.priceFils - lastChange.oldPriceFils) / lastChange.oldPriceFils * 1000) / 10 : 0,
        usedByCount: items.filter((item) => item.ingredientId === i.id).length,
      };
    });
    const dishes = dishRows.map((dish) => {
      const lines = items.filter((item) => item.dishId === dish.id).map((item) => {
        const ingredient = ingredientRows.find((i) => i.id === item.ingredientId)!;
        return {
          ingredientId: ingredient.id, ingredientName: ingredient.name, quantity: item.quantity, unit: item.unit,
          cost: ingredientLineCost(ingredient.priceFils, ingredient.unit, item.quantity, item.unit, ingredient.wastePercent) / 1000,
        };
      });
      const ingredientCostFils = lines.reduce((sum, line) => sum + Math.round(line.cost * 1000), 0);
      const totalCostFils = ingredientCostFils + dish.packagingCostFils;
      const dishPrices = overrides.filter((p) => p.dishId === dish.id);
      return {
        id: dish.id, name: dish.name, sellingPrice: dish.sellingPriceFils / 1000,
        packagingCost: dish.packagingCostFils / 1000, ingredientCost: ingredientCostFils / 1000,
        totalCost: totalCostFils / 1000, items: lines,
        channelPrices: dishPrices.map((p) => ({ channelId: p.channelId, price: p.priceFils / 1000 })),
        profits: channelRows.map((channel) => ({
          channelId: channel.id, channelName: channel.name,
          ...channelProfit(totalCostFils,
            dishPrices.find((p) => p.channelId === channel.id)?.priceFils ?? dish.sellingPriceFils,
            channel.commissionPercent, channel.fixedFeeFils),
        })),
      };
    });
    const alerts: Alert[] = [];
    for (const ingredient of ingredients) {
      if (ingredient.priceChangePercent > 0) alerts.push({
        id: `price-${ingredient.id}`, kind: "price_increase", severity: "warning",
        title: `ارتفاع سعر ${ingredient.name}`,
        message: `ارتفع من ${ingredient.previousPrice!.toFixed(3)} إلى ${ingredient.price.toFixed(3)} د.ك للوحدة (${ingredient.priceChangePercent}%). أُعيد حساب تكلفة ${ingredient.usedByCount} طبق مرتبط تلقائياً. المقارنة مع آخر تعديل مسجل.`,
        dishId: null, ingredientId: ingredient.id,
      });
    }
    for (const dish of dishes) for (const profit of dish.profits) {
      if (profit.profit < 0) alerts.push({
        id: `loss-${dish.id}-${profit.channelId}`, kind: "loss", severity: "danger", title: dish.name,
        message: `تخسر ${Math.abs(profit.profit).toFixed(3)} د.ك على ${profit.channelName}. سعر التعادل ${profit.breakEvenPrice.toFixed(3)} د.ك.`,
        dishId: dish.id, ingredientId: null,
      });
      else if (profit.marginPercent < 20) alerts.push({
        id: `pricing-${dish.id}-${profit.channelId}`, kind: "pricing", severity: "info", title: `راجع سعر ${dish.name} على ${profit.channelName}`,
        message: profit.suggestedPrice === null
          ? "لا يمكن بلوغ هامش 20% مع نسبة العمولة الحالية؛ راجع العمولة أو القناة."
          : `الهامش الحالي ${profit.marginPercent}%. سعر إرشادي لهامش 20%: ${profit.suggestedPrice.toFixed(3)} د.ك.`,
        dishId: dish.id, ingredientId: null,
      });
    }
    const state = { ingredients, dishes, channels, alerts };
    GetKitchenStateResponse.parse(state);
    return state;
  }, { isolationLevel: "repeatable read", accessMode: "read only" });
}
