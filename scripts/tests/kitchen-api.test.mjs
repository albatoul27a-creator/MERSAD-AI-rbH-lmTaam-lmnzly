import assert from "node:assert/strict";
import test from "node:test";

const origin = process.env.API_ORIGIN ?? "http://localhost:80";
async function request(path, method = "GET", body) {
  const response = await fetch(`${origin}/api${path}`, {
    method,
    ...(body === undefined ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
  });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : undefined };
}
async function state() {
  const result = await request("/kitchen/state");
  assert.equal(result.status, 200);
  return result.data;
}

test("ingredient -> recipe -> price rise -> channel overrides persist without losing old ledger data", async () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ingredientName = `مكون اختبار ${suffix}`;
  const dishName = `طبق اختبار ${suffix}`;
  let ingredientId;
  let dishId;
  const beforeLedger = await request("/transactions");
  try {
    assert.equal((await request("/kitchen/ingredients", "POST", {
      name: ingredientName, price: 4, unit: "kg", wastePercent: 20,
    })).status, 201);
    let snapshot = await state();
    const ingredient = snapshot.ingredients.find((i) => i.name === ingredientName);
    assert.ok(ingredient);
    ingredientId = ingredient.id;
    const input = {
      name: dishName, sellingPrice: 1.5, packagingCost: 0.25,
      items: [{ ingredientId, quantity: 200, unit: "g" }], channelPrices: [],
    };
    assert.equal((await request("/kitchen/dishes", "POST", input)).status, 201);
    snapshot = await state();
    let dish = snapshot.dishes.find((d) => d.name === dishName);
    dishId = dish.id;
    assert.equal(dish.totalCost, 1.25);
    assert.equal(dish.ingredientCost, 1);
    const talabat = snapshot.channels.find((c) => c.key === "talabat");
    assert.ok(talabat);
    const expectedProfit = (price, cogs) => (
      Math.round(price * 1000) - Math.round(price * 1000 * talabat.commissionPercent / 100) -
      Math.round(talabat.fixedFee * 1000) - Math.round(cogs * 1000)
    ) / 1000;
    assert.equal(dish.profits.find((p) => p.channelId === talabat.id).profit, expectedProfit(1.5, 1.25));
    assert.equal((await request(`/kitchen/ingredients/${ingredientId}`, "DELETE")).status, 409);
    assert.equal((await request(`/kitchen/ingredients/${ingredientId}`, "PUT", {
      name: ingredientName, price: 4, unit: "l", wastePercent: 20,
    })).status, 409);
    assert.equal((await request("/kitchen/dishes", "POST", {
      ...input, items: [{ ingredientId, quantity: 1, unit: "l" }],
    })).status, 400);
    assert.equal((await request("/kitchen/ingredients", "POST", {
      name: ingredientName, price: 0.0001, unit: "kg", wastePercent: 0,
    })).status, 400);
    assert.equal((await request(`/kitchen/ingredients/${ingredientId}`, "PUT", {
      name: ingredientName, price: 5, unit: "kg", wastePercent: 20,
    })).status, 200);
    snapshot = await state();
    dish = snapshot.dishes.find((d) => d.id === dishId);
    assert.equal(dish.totalCost, 1.5);
    const changed = snapshot.ingredients.find((i) => i.id === ingredientId);
    assert.equal(changed.previousPrice, 4);
    assert.equal(changed.priceChangePercent, 25);
    assert.ok(snapshot.alerts.some((a) => a.kind === "price_increase" && a.ingredientId === ingredientId));
    if (expectedProfit(1.5, 1.5) < 0) {
      assert.ok(snapshot.alerts.some((a) => a.kind === "loss" && a.dishId === dishId && a.message.includes("طلبات")));
    }
    assert.equal((await request(`/kitchen/dishes/${dishId}`, "PUT", {
      ...input, channelPrices: [{ channelId: talabat.id, price: 2.5 }],
    })).status, 200);
    dish = (await state()).dishes.find((d) => d.id === dishId);
    assert.equal(dish.profits.find((p) => p.channelId === talabat.id).sellingPrice, 2.5);
    assert.equal(dish.profits.find((p) => p.channelId === talabat.id).profit, expectedProfit(2.5, 1.5));
    assert.equal((await request(`/kitchen/dishes/${dishId}`, "PUT", input)).status, 200);
    dish = (await state()).dishes.find((d) => d.id === dishId);
    assert.equal(dish.channelPrices.length, 0);
    assert.equal(dish.profits.find((p) => p.channelId === talabat.id).sellingPrice, 1.5);
    assert.equal((await request(`/kitchen/channels/${talabat.id}`, "PUT", {
      commissionPercent: talabat.commissionPercent, fixedFee: talabat.fixedFee,
    })).status, 200);
    assert.equal((await request(`/kitchen/channels/${talabat.id}`, "PUT", {
      commissionPercent: 100, fixedFee: 0,
    })).status, 400);
    assert.deepEqual((await request("/transactions")).data, beforeLedger.data);
  } finally {
    if (dishId) await request(`/kitchen/dishes/${dishId}`, "DELETE");
    if (ingredientId) await request(`/kitchen/ingredients/${ingredientId}`, "DELETE");
  }
});
