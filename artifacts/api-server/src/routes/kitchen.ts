import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db, deliveryChannels, dishChannelPrices, ingredientPriceHistory, kitchenDishes, kitchenIngredients, recipeItems,
} from "@workspace/db";
import {
  CreateDishBody, CreateIngredientBody, DeleteDishParams, DeleteIngredientParams, UpdateDeliveryChannelBody,
  UpdateDeliveryChannelParams, UpdateDishBody, UpdateDishParams, UpdateIngredientBody, UpdateIngredientParams,
} from "@workspace/api-zod";
import { compatibleUnits } from "../lib/costing";
import { getKitchenSnapshot } from "../lib/kitchen-state";

const router: IRouter = Router();
const moneyValid = (n: number) => Number.isFinite(n) && Math.abs(n * 1000 - Math.round(n * 1000)) < 0.000001;
const fils = (n: number) => Math.round(n * 1000);

class KitchenError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

router.get("/kitchen/state", async (_req, res): Promise<void> => {
  res.json(await getKitchenSnapshot());
});

router.post("/kitchen/ingredients", async (req, res): Promise<void> => {
  const parsed = CreateIngredientBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.name.trim() || !moneyValid(parsed.data.price)) {
    res.status(400).json({ error: "أدخل اسم المكون وسعرًا صحيحًا بثلاث منازل عشرية كحد أقصى" });
    return;
  }
  const data = parsed.data;
  await db.insert(kitchenIngredients).values({
    name: data.name.trim(), priceFils: fils(data.price), unit: data.unit, wastePercent: data.wastePercent,
  });
  res.status(201).end();
});

router.put("/kitchen/ingredients/:id", async (req, res): Promise<void> => {
  const params = UpdateIngredientParams.safeParse(req.params);
  const parsed = UpdateIngredientBody.safeParse(req.body);
  if (!params.success || !parsed.success || !parsed.data.name.trim() || !moneyValid(parsed.data.price)) {
    res.status(400).json({ error: "بيانات المكون غير صحيحة" }); return;
  }
  try {
    await db.transaction(async (tx) => {
      const [previous] = await tx.select().from(kitchenIngredients).where(eq(kitchenIngredients.id, params.data.id)).for("update");
      if (!previous) throw new KitchenError(404, "المكون غير موجود");
      const data = parsed.data;
      const used = await tx.select().from(recipeItems).where(eq(recipeItems.ingredientId, previous.id)).limit(1);
      if (data.unit !== previous.unit && used.length) {
        throw new KitchenError(409, "لا يمكن تغيير وحدة مكون مرتبط بوصفة. أزل ارتباطه من الوصفات أولاً، أو أضف مكوناً جديداً.");
      }
      if (data.unit !== previous.unit) {
        // Append a baseline instead of erasing history when purchase units change.
        await tx.insert(ingredientPriceHistory).values({
          ingredientId: previous.id, oldPriceFils: fils(data.price), newPriceFils: fils(data.price), unit: data.unit,
        });
      } else if (previous.priceFils !== fils(data.price)) {
        await tx.insert(ingredientPriceHistory).values({
          ingredientId: previous.id, oldPriceFils: previous.priceFils, newPriceFils: fils(data.price), unit: data.unit,
        });
      }
      await tx.update(kitchenIngredients).set({
        name: data.name.trim(), priceFils: fils(data.price), unit: data.unit,
        wastePercent: data.wastePercent, updatedAt: new Date(),
      }).where(eq(kitchenIngredients.id, previous.id));
    });
    res.status(200).end();
  } catch (error) {
    if (error instanceof KitchenError) { res.status(error.status).json({ error: error.message }); return; }
    throw error;
  }
});

router.delete("/kitchen/ingredients/:id", async (req, res): Promise<void> => {
  const params = DeleteIngredientParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "رقم المكون غير صحيح" }); return; }
  try {
    await db.transaction(async (tx) => {
      const [row] = await tx.select().from(kitchenIngredients).where(eq(kitchenIngredients.id, params.data.id)).for("update");
      if (!row) throw new KitchenError(404, "المكون غير موجود");
      const used = await tx.select().from(recipeItems).where(eq(recipeItems.ingredientId, row.id)).limit(1);
      if (used.length) throw new KitchenError(409, "المكون مستخدم في وصفة؛ احذفه من الوصفات أولاً لحماية حساب التكلفة.");
      await tx.delete(kitchenIngredients).where(eq(kitchenIngredients.id, row.id));
    });
    res.sendStatus(204);
  } catch (error) {
    if (error instanceof KitchenError) { res.status(error.status).json({ error: error.message }); return; }
    throw error;
  }
});

type DishData = ReturnType<typeof CreateDishBody.parse>;
async function saveDish(data: DishData, id?: number) {
  if (!data.name.trim() || !moneyValid(data.sellingPrice) || !moneyValid(data.packagingCost) ||
      data.channelPrices.some((p) => !moneyValid(p.price)) ||
      new Set(data.items.map((i) => i.ingredientId)).size !== data.items.length ||
      new Set(data.channelPrices.map((p) => p.channelId)).size !== data.channelPrices.length) {
    throw new KitchenError(400, "تحقق من الأسعار بثلاث منازل عشرية، ولا تكرر المكون أو القناة في الوصفة.");
  }
  await db.transaction(async (tx) => {
    // Share locks keep ingredients stable while validating recipe units and prevent concurrent deletion.
    const ingredients = await tx.select().from(kitchenIngredients).for("share");
    const channels = await tx.select().from(deliveryChannels).for("share");
    for (const item of data.items) {
      const ingredient = ingredients.find((i) => i.id === item.ingredientId);
      if (!ingredient || !compatibleUnits(ingredient.unit, item.unit)) {
        throw new KitchenError(400, "يوجد مكون غير موجود أو وحدة غير متوافقة: استخدم الوزن مع الوزن، والحجم مع الحجم، والحبة مع الحبة.");
      }
    }
    if (data.channelPrices.some((p) => !channels.some((c) => c.id === p.channelId))) {
      throw new KitchenError(400, "قناة التوصيل غير موجودة");
    }
    const values = { name: data.name.trim(), sellingPriceFils: fils(data.sellingPrice), packagingCostFils: fils(data.packagingCost) };
    let dishId: number;
    if (id !== undefined) {
      const [dish] = await tx.update(kitchenDishes).set(values).where(eq(kitchenDishes.id, id)).returning();
      if (!dish) throw new KitchenError(404, "الطبق غير موجود");
      dishId = id;
      await tx.delete(recipeItems).where(eq(recipeItems.dishId, id));
      await tx.delete(dishChannelPrices).where(eq(dishChannelPrices.dishId, id));
    } else {
      const [dish] = await tx.insert(kitchenDishes).values(values).returning();
      dishId = dish!.id;
    }
    await tx.insert(recipeItems).values(data.items.map((item) => ({ ...item, dishId })));
    if (data.channelPrices.length) await tx.insert(dishChannelPrices).values(
      data.channelPrices.map((p) => ({ dishId, channelId: p.channelId, priceFils: fils(p.price) })),
    );
  });
}

router.post("/kitchen/dishes", async (req, res): Promise<void> => {
  const parsed = CreateDishBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "أدخل مكونات الوصفة والكميات والأسعار الصحيحة" }); return; }
  try { await saveDish(parsed.data); res.status(201).end(); }
  catch (error) {
    if (error instanceof KitchenError) { res.status(error.status).json({ error: error.message }); return; }
    throw error;
  }
});

router.put("/kitchen/dishes/:id", async (req, res): Promise<void> => {
  const params = UpdateDishParams.safeParse(req.params);
  const parsed = UpdateDishBody.safeParse(req.body);
  if (!params.success || !parsed.success) { res.status(400).json({ error: "بيانات الطبق غير صحيحة" }); return; }
  try { await saveDish(parsed.data, params.data.id); res.status(200).end(); }
  catch (error) {
    if (error instanceof KitchenError) { res.status(error.status).json({ error: error.message }); return; }
    throw error;
  }
});

router.delete("/kitchen/dishes/:id", async (req, res): Promise<void> => {
  const params = DeleteDishParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "رقم الطبق غير صحيح" }); return; }
  const [row] = await db.delete(kitchenDishes).where(eq(kitchenDishes.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "الطبق غير موجود" }); return; }
  res.sendStatus(204);
});

router.put("/kitchen/channels/:id", async (req, res): Promise<void> => {
  const params = UpdateDeliveryChannelParams.safeParse(req.params);
  const parsed = UpdateDeliveryChannelBody.safeParse(req.body);
  if (!params.success || !parsed.success || !moneyValid(parsed.data.fixedFee)) {
    res.status(400).json({ error: "العمولة يجب أن تكون بين 0 و95% والرسوم مبلغاً صحيحاً" }); return;
  }
  const [row] = await db.update(deliveryChannels).set({
    commissionPercent: parsed.data.commissionPercent, fixedFeeFils: fils(parsed.data.fixedFee),
  }).where(eq(deliveryChannels.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "قناة التوصيل غير موجودة" }); return; }
  res.status(200).end();
});

export default router;
