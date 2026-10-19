import assert from "node:assert/strict";
import test from "node:test";
import { compatibleUnits, ingredientLineCost, channelProfit } from "../../artifacts/api-server/src/lib/costing.ts";

test("kg prices convert to grams and waste inflates net required quantity", () => {
  assert.equal(ingredientLineCost(4000, "kg", 200, "g", 20), 1000);
  assert.equal(ingredientLineCost(4000, "kg", 0.2, "kg", 20), 1000);
});

test("litres convert to millilitres and pieces remain count based", () => {
  assert.equal(ingredientLineCost(1500, "l", 100, "ml", 0), 150);
  assert.equal(ingredientLineCost(125, "piece", 2, "piece", 0), 250);
  assert.equal(ingredientLineCost(1, "g", 1, "kg", 0), 1000);
});

test("incompatible dimensions and invalid waste cannot silently create a cost", () => {
  assert.equal(compatibleUnits("g", "ml"), false);
  assert.throws(() => ingredientLineCost(1000, "kg", 1, "l", 0));
  assert.throws(() => ingredientLineCost(1000, "kg", 1, "kg", 100));
});

test("packaging in COGS plus channel commission and fixed fees yield real losses", () => {
  const cogs = ingredientLineCost(4000, "kg", 200, "g", 20) + 250;
  const local = channelProfit(cogs, 1500, 0, 0);
  const talabat = channelProfit(cogs, 1500, 30, 100);
  const deliveroo = channelProfit(cogs, 1750, 25, 50);
  assert.equal(local.profit, 0.250);
  assert.equal(talabat.profit, -0.300);
  assert.equal(talabat.netRevenue, 0.950);
  assert.equal(deliveroo.profit, 0.012);
  assert.equal(talabat.breakEvenPrice, 1.929);
  assert.equal(talabat.suggestedPrice, 2.700);
});

test("suggested price uses margin on selling price, not a 20% cost markup", () => {
  const result = channelProfit(1000, 2000, 30, 0);
  assert.ok(Math.abs(result.suggestedPrice - 2) <= 0.001);
  assert.equal(channelProfit(1000, 2000, 80, 0).suggestedPrice, null);
});

test("a price rise increases COGS and decreases every channel profit immediately", () => {
  const before = ingredientLineCost(3000, "kg", 250, "g", 10) + 200;
  const after = ingredientLineCost(4000, "kg", 250, "g", 10) + 200;
  assert.ok(after > before);
  for (const commission of [0, 30, 25]) {
    assert.ok(channelProfit(after, 1500, commission, 0).profit < channelProfit(before, 1500, commission, 0).profit);
  }
});
