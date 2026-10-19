import { doublePrecision, integer, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";

export const kitchenIngredients = pgTable("kitchen_ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  priceFils: integer("price_fils").notNull(),
  unit: text("unit", { enum: ["kg", "g", "l", "ml", "piece"] }).notNull(),
  wastePercent: doublePrecision("waste_percent").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ingredientPriceHistory = pgTable("ingredient_price_history", {
  id: serial("id").primaryKey(),
  ingredientId: integer("ingredient_id").notNull().references(() => kitchenIngredients.id, { onDelete: "cascade" }),
  oldPriceFils: integer("old_price_fils").notNull(),
  newPriceFils: integer("new_price_fils").notNull(),
  unit: text("unit", { enum: ["kg", "g", "l", "ml", "piece"] }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const kitchenDishes = pgTable("kitchen_dishes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sellingPriceFils: integer("selling_price_fils").notNull(),
  packagingCostFils: integer("packaging_cost_fils").notNull(),
});

export const recipeItems = pgTable("recipe_items", {
  id: serial("id").primaryKey(),
  dishId: integer("dish_id").notNull().references(() => kitchenDishes.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id").notNull().references(() => kitchenIngredients.id, { onDelete: "restrict" }),
  quantity: doublePrecision("quantity").notNull(),
  unit: text("unit", { enum: ["kg", "g", "l", "ml", "piece"] }).notNull(),
}, (t) => [unique().on(t.dishId, t.ingredientId)]);

export const deliveryChannels = pgTable("delivery_channels", {
  id: serial("id").primaryKey(),
  key: text("key", { enum: ["local", "talabat", "deliveroo"] }).notNull().unique(),
  name: text("name").notNull(),
  commissionPercent: doublePrecision("commission_percent").notNull(),
  fixedFeeFils: integer("fixed_fee_fils").notNull().default(0),
});

export const dishChannelPrices = pgTable("dish_channel_prices", {
  id: serial("id").primaryKey(),
  dishId: integer("dish_id").notNull().references(() => kitchenDishes.id, { onDelete: "cascade" }),
  channelId: integer("channel_id").notNull().references(() => deliveryChannels.id, { onDelete: "restrict" }),
  priceFils: integer("price_fils").notNull(),
}, (t) => [unique().on(t.dishId, t.channelId)]);
