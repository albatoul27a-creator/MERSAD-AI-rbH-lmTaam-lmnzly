import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import type { Ingredient, IngredientInput } from '@workspace/api-client-react';
import { Field, fieldCls, primaryBtn } from '@/components/field';
import { allUnits, unitLabel, type Unit } from '@/lib/kitchen';

interface V { name: string; price: string; unit: string; wastePercent: string }

export function IngredientForm({ initial, busy, error, onSubmit, onCancel }: {
  initial?: Ingredient; busy: boolean; error: string | null; onSubmit: (v: IngredientInput) => void; onCancel: () => void;
}) {
  const form = useForm<V>({
    defaultValues: {
      name: initial?.name ?? '', price: initial ? String(initial.price) : '',
      unit: initial?.unit ?? 'kg', wastePercent: initial ? String(initial.wastePercent) : '0',
    },
  });
  const { register, formState: { errors } } = form;
  return (
    <Form {...form}>
      <form noValidate className="space-y-4" onSubmit={form.handleSubmit((v) => onSubmit({ name: v.name.trim(), price: Number(v.price), unit: v.unit as Unit, wastePercent: Number(v.wastePercent) || 0 }))}>
        <Field label="اسم المكون" error={errors.name?.message}>
          <input className={fieldCls} maxLength={120} data-testid="input-ingredient-name" placeholder="مثال: صدر دجاج" {...register('name', { validate: (v) => !!v.trim() || 'أدخل اسم المكون' })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="وحدة الشراء" hint={initial && initial.usedByCount > 0 ? 'الوحدة مقفلة لأن المكون مستخدم في وصفات.' : undefined}>
            <select className={fieldCls} data-testid="select-ingredient-unit" {...register('unit')}>
              {allUnits.map((u) => <option key={u} value={u}>{unitLabel[u]}</option>)}
            </select>
          </Field>
          <Field label="سعر الشراء لكل وحدة (د.ك)" error={errors.price?.message}>
            <input type="number" step="any" dir="ltr" className={fieldCls + ' text-right'} data-testid="input-ingredient-price" placeholder="0.000"
              {...register('price', { validate: (v) => (Number(v) > 0 && Number(v) <= 100000) || 'أدخل سعراً أكبر من صفر' })} />
          </Field>
        </div>
        <Field label="نسبة الهدر %" hint="النسبة التي تضيع عند التنظيف والتقطيع، من 0 إلى 95." error={errors.wastePercent?.message}>
          <input type="number" step="any" dir="ltr" className={fieldCls + ' text-right'} data-testid="input-ingredient-waste"
            {...register('wastePercent', { validate: (v) => (Number(v) >= 0 && Number(v) <= 95) || 'النسبة بين 0 و95' })} />
        </Field>
        {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" data-testid="text-form-error">{error}</p>}
        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={busy} data-testid="button-save" className={primaryBtn + ' flex-1'}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}{initial ? 'حفظ التعديلات' : 'إضافة المكون'}
          </button>
          <button type="button" onClick={onCancel} data-testid="button-cancel" className="rounded-xl border px-5 py-2.5 text-sm font-medium transition hover:bg-muted">إلغاء</button>
        </div>
      </form>
    </Form>
  );
}
