import { Loader2, Plus, X } from 'lucide-react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import type { Dish, DishInput, KitchenState } from '@workspace/api-client-react';
import { Field, fieldCls, primaryBtn } from '@/components/field';
import { kwd } from '@/lib/format';
import { compatibleUnits, lineCost, unitLabel, type Unit } from '@/lib/kitchen';

interface Row { ingredientId: string; quantity: string; unit: string }
interface V { name: string; sellingPrice: string; packagingCost: string; items: Row[]; overrides: string[] }

const validMoney = (value: string, zero = false) => {
  const number = Number(value);
  return value.trim() !== '' && Number.isFinite(number) && (zero ? number >= 0 : number > 0) &&
    number <= 100000 && Math.abs(number * 1000 - Math.round(number * 1000)) < 0.000001;
};

export function DishForm({ initial, state, busy, error, onSubmit, onCancel }: {
  initial?: Dish; state: KitchenState; busy: boolean; error: string | null; onSubmit: (v: DishInput) => void; onCancel: () => void;
}) {
  const { ingredients, channels } = state;
  const form = useForm<V>({
    defaultValues: initial ? {
      name: initial.name, sellingPrice: String(initial.sellingPrice), packagingCost: String(initial.packagingCost),
      items: initial.items.map((i) => ({ ingredientId: String(i.ingredientId), quantity: String(i.quantity), unit: i.unit })),
      overrides: channels.map((c) => { const p = initial.channelPrices.find((x) => x.channelId === c.id); return p ? String(p.price) : ''; }),
    } : {
      name: '', sellingPrice: '', packagingCost: '0',
      items: [{ ingredientId: '', quantity: '', unit: 'g' }], overrides: channels.map(() => ''),
    },
  });
  const { register, control, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const w = useWatch({ control }) as Partial<V>;

  const lines = (w.items ?? []).map((r) => {
    const ing = ingredients.find((i) => String(i.id) === r?.ingredientId);
    const q = Number(r?.quantity);
    if (!ing || !(q > 0) || !compatibleUnits(ing.unit).includes(r.unit as Unit)) return 0;
    return lineCost(ing, q, r.unit as Unit);
  });
  const ingCost = lines.reduce((a, b) => a + b, 0);
  const pack = Number(w.packagingCost) || 0;
  const cogs = Math.round((ingCost + pack) * 1000 + 1e-9) / 1000;
  const base = Number(w.sellingPrice) || 0;

  function submit(v: V) {
    onSubmit({
      name: v.name.trim(), sellingPrice: Number(v.sellingPrice), packagingCost: Number(v.packagingCost) || 0,
      items: v.items.map((r) => ({ ingredientId: Number(r.ingredientId), quantity: Number(r.quantity), unit: r.unit as Unit })),
      channelPrices: channels.flatMap((c, i) => (Number(v.overrides[i]) > 0 ? [{ channelId: c.id, price: Number(v.overrides[i]) }] : [])),
    });
  }

  return (
    <Form {...form}>
      <form noValidate className="space-y-5" onSubmit={form.handleSubmit(submit)}>
        <p className="rounded-xl bg-accent/60 px-3 py-2 text-xs leading-relaxed text-accent-foreground">الوصفة الواحدة تمثل طبقاً واحداً أو حصة واحدة تُباع للعميل.</p>
        <Field label="اسم الطبق" error={errors.name?.message}>
          <input className={fieldCls} maxLength={120} data-testid="input-dish-name" placeholder="مثال: برياني دجاج" {...register('name', { validate: (v) => !!v.trim() || 'أدخل اسم الطبق' })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="سعر البيع الأساسي (د.ك)" error={errors.sellingPrice?.message}>
            <input type="number" step="0.001" dir="ltr" className={fieldCls + ' text-right'} data-testid="input-dish-price" placeholder="0.000"
              {...register('sellingPrice', { validate: (v) => validMoney(v) || 'أدخل سعراً موجباً بثلاث خانات عشرية كحد أقصى' })} />
          </Field>
          <Field label="تكلفة التغليف للطبق (د.ك)" error={errors.packagingCost?.message}>
            <input type="number" step="0.001" dir="ltr" className={fieldCls + ' text-right'} data-testid="input-dish-packaging"
              {...register('packagingCost', { validate: (v) => validMoney(v, true) || 'أدخل تكلفة صحيحة أو صفر بثلاث خانات عشرية كحد أقصى' })} />
          </Field>
        </div>

        <fieldset className="space-y-3">
          <legend className="mb-1 text-sm font-medium">مكونات الطبق (الكمية الصافية القابلة للاستخدام)</legend>
          {ingredients.length === 0 && <p className="rounded-xl bg-destructive/5 px-3 py-2 text-sm text-destructive">أضف مكونات أولاً من صفحة المكونات.</p>}
          {fields.map((f, idx) => {
            const ing = ingredients.find((i) => String(i.id) === w.items?.[idx]?.ingredientId);
            const units = ing ? compatibleUnits(ing.unit) : (['kg', 'g', 'l', 'ml', 'piece'] as Unit[]);
            const er = errors.items?.[idx];
            return (
              <div key={f.id} className="rounded-xl border p-3" data-testid={'row-item-' + idx}>
                <div className="flex gap-2">
                  <select className={fieldCls} data-testid={'select-item-ingredient-' + idx}
                    {...register(`items.${idx}.ingredientId` as const, {
                      validate: (v) => !!v || 'اختر المكون',
                      onChange: (e) => { const x = ingredients.find((i) => String(i.id) === e.target.value); if (x) form.setValue(`items.${idx}.unit` as const, x.unit); },
                    })}>
                    <option value="">اختر مكوناً</option>
                    {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                  <button type="button" onClick={() => remove(idx)} disabled={fields.length === 1} aria-label="إزالة المكون" data-testid={'button-remove-item-' + idx} className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"><X className="h-4 w-4" /></button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input type="number" step="any" dir="ltr" placeholder="الكمية" className={fieldCls + ' text-right'} data-testid={'input-item-qty-' + idx}
                    {...register(`items.${idx}.quantity` as const, { validate: (v) => Number(v) > 0 && Number(v) <= 100000 || 'أدخل كمية صحيحة' })} />
                  <select className={fieldCls + ' max-w-28'} data-testid={'select-item-unit-' + idx} {...register(`items.${idx}.unit` as const)}>
                    {units.map((u) => <option key={u} value={u}>{unitLabel[u]}</option>)}
                  </select>
                  <span className="num w-24 shrink-0 text-left text-sm font-medium" data-testid={'text-item-cost-' + idx}>{kwd(lines[idx] ?? 0)}</span>
                </div>
                {(er?.ingredientId || er?.quantity) && <p className="mt-1.5 text-xs text-destructive">{er.ingredientId?.message ?? er.quantity?.message}</p>}
              </div>
            );
          })}
          <button type="button" onClick={() => append({ ingredientId: '', quantity: '', unit: 'g' })} data-testid="button-add-item" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"><Plus className="h-4 w-4" /> إضافة مكون</button>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium">أسعار القنوات <span className="font-normal text-muted-foreground">(اختياري، اتركه فارغاً لاستخدام السعر الأساسي)</span></legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {channels.map((c, i) => (
              <Field key={c.id} label={c.name} error={errors.overrides?.[i]?.message}>
                <input type="number" step="0.001" dir="ltr" placeholder={base > 0 ? String(base) : '0.000'} className={fieldCls + ' text-right'} data-testid={'input-override-' + c.id} {...register(`overrides.${i}` as const, { validate: (v) => v.trim() === '' || validMoney(v) || 'أدخل سعراً موجباً صحيحاً أو اتركه فارغاً' })} />
              </Field>
            ))}
          </div>
        </fieldset>

        <section className="rounded-2xl bg-muted/70 p-4" data-testid="preview-cogs">
          <p className="text-xs text-muted-foreground">تكلفة الطبق التلقائية</p>
          <p className="mt-1 text-2xl font-bold text-primary" data-testid="text-preview-cogs"><span className="num">{kwd(cogs)}</span></p>
          <p className="mt-1 text-xs text-muted-foreground">مكونات <span className="num">{kwd(ingCost)}</span> + تغليف <span className="num">{kwd(pack)}</span></p>
          {base > 0 && (
            <ul className="mt-3 space-y-1 border-t pt-3 text-sm">
              {channels.map((c, i) => {
                const price = Number(w.overrides?.[i]) > 0 ? Number(w.overrides?.[i]) : base;
                const priceFils = Math.round(price * 1000);
                const profit = (priceFils - Math.round(priceFils * c.commissionPercent / 100) - Math.round(c.fixedFee * 1000) - Math.round(cogs * 1000)) / 1000;
                return (
                  <li key={c.id} className="flex justify-between gap-2">
                    <span>{c.name}</span>
                    <span className={'num font-medium ' + (profit < 0 ? 'text-destructive' : '')}>{profit < 0 ? 'خسارة ' + kwd(-profit) : 'ربح ' + kwd(profit)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" data-testid="text-form-error">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={busy} data-testid="button-save" className={primaryBtn + ' flex-1'}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}{initial ? 'حفظ التعديلات' : 'إضافة الطبق'}
          </button>
          <button type="button" onClick={onCancel} data-testid="button-cancel" className="rounded-xl border px-5 py-2.5 text-sm font-medium transition hover:bg-muted">إلغاء</button>
        </div>
      </form>
    </Form>
  );
}
