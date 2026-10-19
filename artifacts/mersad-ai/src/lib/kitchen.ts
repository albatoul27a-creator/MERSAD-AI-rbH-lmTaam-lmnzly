import { KitchenUnit } from '@workspace/api-client-react';

export type Unit = KitchenUnit;
export const unitLabel: Record<Unit, string> = { kg: 'كغ', g: 'غ', l: 'لتر', ml: 'مل', piece: 'حبة' };
export const allUnits: Unit[] = ['kg', 'g', 'l', 'ml', 'piece'];
const spec: Record<Unit, { dim: 'm' | 'v' | 'p'; f: number }> = {
  kg: { dim: 'm', f: 1000 }, g: { dim: 'm', f: 1 },
  l: { dim: 'v', f: 1000 }, ml: { dim: 'v', f: 1 },
  piece: { dim: 'p', f: 1 },
};
export const compatibleUnits = (u: Unit): Unit[] => allUnits.filter((x) => spec[x].dim === spec[u].dim);
export const convert = (q: number, from: Unit, to: Unit) => (q * spec[from].f) / spec[to].f;
const fils = (n: number) => Math.round(n * 1000 + 1e-9) / 1000;
export function lineCost(ing: { price: number; unit: Unit; wastePercent: number }, qty: number, unit: Unit) {
  return fils((ing.price * convert(qty, unit, ing.unit)) / (1 - ing.wastePercent / 100));
}
export function errMsg(e: unknown, fallback = 'حدث خطأ غير متوقع، حاول مرة أخرى.') {
  const d = (e as { data?: { error?: unknown } } | null)?.data;
  if (d && typeof d.error === 'string' && d.error) return d.error;
  return fallback;
}
