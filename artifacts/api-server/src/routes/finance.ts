import { Router, type IRouter } from "express";
import { and, desc, eq, gte, ilike, lt, or } from "drizzle-orm";
import { db, transactionsTable, type TransactionRow } from "@workspace/db";
import {
  CreateTransactionBody,
  CreateTransactionResponse,
  DeleteTransactionParams,
  GetDashboardSummaryResponse,
  GetTransactionsQueryParams,
  GetTransactionsResponse,
  UpdateTransactionBody,
  UpdateTransactionParams,
  UpdateTransactionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serialize(row: TransactionRow) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    category: row.category,
    amount: row.amountFils / 1000,
    transactionDate: row.transactionDate,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}

function validAmount(value: number | undefined) {
  return value === undefined || (
    value > 0 && value <= 2_000_000 &&
    Math.abs(value * 1000 - Math.round(value * 1000)) < 0.000001
  );
}

function validDate(value: unknown) {
  if (value === undefined) return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function monthOffset(month: string, offset: number) {
  const [year, number] = month.split("-").map(Number);
  return new Date(Date.UTC(year!, number! - 1 + offset, 1)).toISOString().slice(0, 7);
}

function currentMonth() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kuwait", year: "numeric", month: "2-digit",
  }).formatToParts(new Date());
  return `${parts.find((p) => p.type === "year")!.value}-${parts.find((p) => p.type === "month")!.value}`;
}

router.get("/transactions", async (req, res): Promise<void> => {
  const parsed = GetTransactionsQueryParams.safeParse(req.query);
  if (!parsed.success || (parsed.data.month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(parsed.data.month))) {
    res.status(400).json({ error: "معايير البحث غير صحيحة" });
    return;
  }
  const { type, search, month } = parsed.data;
  const conditions = [];
  if (type) conditions.push(eq(transactionsTable.type, type));
  if (search) {
    const escaped = search.replace(/[\\%_]/g, "\\$&");
    conditions.push(or(ilike(transactionsTable.title, `%${escaped}%`), ilike(transactionsTable.category, `%${escaped}%`)));
  }
  if (month) {
    conditions.push(gte(transactionsTable.transactionDate, `${month}-01`));
    conditions.push(lt(transactionsTable.transactionDate, `${monthOffset(month, 1)}-01`));
  }
  const rows = await db.select().from(transactionsTable)
    .where(and(...conditions))
    .orderBy(desc(transactionsTable.transactionDate), desc(transactionsTable.id));
  const data = rows.map(serialize);
  GetTransactionsResponse.parse(data);
  res.json(data);
});

router.post("/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success || !validAmount(parsed.data.amount) || !validDate(req.body.transactionDate)) {
    res.status(400).json({ error: "يرجى إدخال بيانات صحيحة ومبلغ بثلاث منازل عشرية كحد أقصى" });
    return;
  }
  const { amount, transactionDate, ...rest } = parsed.data;
  if (!rest.title.trim() || !rest.category.trim()) {
    res.status(400).json({ error: "العنوان والتصنيف مطلوبان" });
    return;
  }
  const [row] = await db.insert(transactionsTable).values({
    ...rest,
    title: rest.title.trim(),
    category: rest.category.trim(),
    amountFils: Math.round(amount * 1000),
    transactionDate: transactionDate.toISOString().slice(0, 10),
  }).returning();
  const data = serialize(row!);
  CreateTransactionResponse.parse(data);
  res.status(201).json(data);
});

router.patch("/transactions/:id", async (req, res): Promise<void> => {
  const params = UpdateTransactionParams.safeParse(req.params);
  const parsed = UpdateTransactionBody.safeParse(req.body);
  if (!params.success || params.data.id <= 0 || !parsed.success ||
      !validAmount(parsed.data.amount) || !validDate(req.body.transactionDate)) {
    res.status(400).json({ error: "بيانات العملية غير صحيحة" });
    return;
  }
  const { amount, transactionDate, ...rest } = parsed.data;
  if ((rest.title !== undefined && !rest.title.trim()) || (rest.category !== undefined && !rest.category.trim())) {
    res.status(400).json({ error: "العنوان والتصنيف مطلوبان" });
    return;
  }
  if (Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "لا توجد تغييرات للحفظ" });
    return;
  }
  const [row] = await db.update(transactionsTable).set({
    ...rest,
    ...(rest.title !== undefined ? { title: rest.title.trim() } : {}),
    ...(rest.category !== undefined ? { category: rest.category.trim() } : {}),
    ...(amount !== undefined ? { amountFils: Math.round(amount * 1000) } : {}),
    ...(transactionDate !== undefined ? { transactionDate: transactionDate.toISOString().slice(0, 10) } : {}),
  }).where(eq(transactionsTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "العملية غير موجودة" });
    return;
  }
  const data = serialize(row);
  UpdateTransactionResponse.parse(data);
  res.json(data);
});

router.delete("/transactions/:id", async (req, res): Promise<void> => {
  const params = DeleteTransactionParams.safeParse(req.params);
  if (!params.success || params.data.id <= 0) {
    res.status(400).json({ error: "رقم العملية غير صحيح" });
    return;
  }
  const [row] = await db.delete(transactionsTable).where(eq(transactionsTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "العملية غير موجودة" });
    return;
  }
  res.sendStatus(204);
});

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const month = currentMonth();
  const startMonth = monthOffset(month, -5);
  const rows = await db.select().from(transactionsTable).where(and(
    gte(transactionsTable.transactionDate, `${startMonth}-01`),
    lt(transactionsTable.transactionDate, `${monthOffset(month, 1)}-01`),
  ));
  const trend = Array.from({ length: 6 }, (_, i) => ({
    month: monthOffset(startMonth, i), income: 0, expense: 0,
  }));
  for (const row of rows) {
    const point = trend.find((entry) => entry.month === row.transactionDate.slice(0, 7));
    if (point) point[row.type] += row.amountFils;
  }
  const current = trend[5]!;
  const previous = trend[4]!;
  const currentProfit = current.income - current.expense;
  const previousProfit = previous.income - previous.expense;
  const change = (now: number, before: number) => before === 0 ? 0 : Math.round((now - before) / Math.abs(before) * 1000) / 10;
  const data = {
    income: current.income / 1000,
    expense: current.expense / 1000,
    netProfit: currentProfit / 1000,
    profitChangePercent: change(currentProfit, previousProfit),
    incomeChangePercent: change(current.income, previous.income),
    transactionCount: rows.filter((row) => row.transactionDate.startsWith(month)).length,
    trend: trend.map((point) => ({ ...point, income: point.income / 1000, expense: point.expense / 1000 })),
  };
  res.json(GetDashboardSummaryResponse.parse(data));
});

export default router;
