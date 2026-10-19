import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import type { Transaction } from '@workspace/api-client-react';
import { todayStr } from '@/lib/format';

export interface FormValues {
  type: 'income' | 'expense';
  title: string;
  category: string;
  amount: number;
  transactionDate: string;
  note: string;
}

const cats = ['مبيعات طلبات', 'مبيعات مناسبات', 'توصيل', 'مواد غذائية', 'تغليف', 'غاز وكهرباء', 'رواتب', 'إعلانات'];
const field = 'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

export function TransactionForm({ initial, busy, error, onSubmit, onCancel }: {
  initial?: Transaction; busy: boolean; error?: string | null; onSubmit: (v: FormValues) => void; onCancel: () => void;
}) {
  const form = useForm<FormValues>({
    defaultValues: {
      type: initial?.type ?? 'income',
      title: initial?.title ?? '',
      category: initial?.category ?? '',
      amount: initial?.amount,
      transactionDate: initial?.transactionDate ?? todayStr(),
      note: initial?.note ?? '',
    },
  });
  const type = form.watch('type');
  const Err = ({ k }: { k: keyof FormValues }) => (
    form.formState.errors[k] ? <p role="alert" className="mt-1 text-xs text-destructive">{form.formState.errors[k]?.message}</p> : null
  );

  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit((values) => onSubmit({
      ...values, title: values.title.trim(), category: values.category.trim(), note: values.note.trim(),
    }))} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {(['income', 'expense'] as const).map((t) => (
          <button key={t} type="button" disabled={busy} onClick={() => form.setValue('type', t)} data-testid={'button-type-' + t}
            className={'rounded-lg py-2 text-sm font-medium transition-all ' + (type === t ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground')}>
            {t === 'income' ? 'دخل' : 'مصروف'}
          </button>
        ))}
      </div>
      <label className="block text-sm font-medium">العنوان
        <input className={field + ' mt-1.5 font-normal'} {...form.register('title', { validate: (v) => !!v.trim() || 'أدخل عنواناً للمعاملة' })} maxLength={120} data-testid="input-title" placeholder="مثال: طلب غداء لعشرين شخصاً" />
        <Err k="title" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium">التصنيف
          <input list="cats" className={field + ' mt-1.5 font-normal'} {...form.register('category', { validate: (v) => !!v.trim() || 'اختر أو اكتب تصنيفاً' })} maxLength={60} data-testid="input-category" />
          <datalist id="cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
          <Err k="category" />
        </label>
        <label className="block text-sm font-medium">المبلغ (د.ك)
          <input type="number" inputMode="decimal" step="0.001" min="0" max="2000000" dir="ltr" className={field + ' mt-1.5 text-right font-normal'} {...form.register('amount', {
            valueAsNumber: true,
            validate: (v) => (Number.isFinite(v) && v > 0 && v <= 2000000 && Math.abs(v * 1000 - Math.round(v * 1000)) < 0.000001) || 'أدخل مبلغاً صحيحاً بثلاث خانات عشرية كحد أقصى',
          })} data-testid="input-amount" placeholder="0.000" />
          <Err k="amount" />
        </label>
      </div>
      <label className="block text-sm font-medium">التاريخ
        <input type="date" className={field + ' mt-1.5 font-normal'} {...form.register('transactionDate', { required: 'اختر التاريخ' })} data-testid="input-date" />
        <Err k="transactionDate" />
      </label>
      <label className="block text-sm font-medium">ملاحظة <span className="font-normal text-muted-foreground">(اختياري)</span>
        <textarea rows={2} maxLength={500} className={field + ' mt-1.5 resize-none font-normal'} {...form.register('note')} data-testid="input-note" />
      </label>
      {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" data-testid="text-form-error">{error}</p>}
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={busy} data-testid="button-save" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[.98] disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}{initial ? 'حفظ التعديلات' : 'إضافة المعاملة'}
        </button>
        <button type="button" onClick={onCancel} data-testid="button-cancel" className="rounded-xl border px-5 py-2.5 text-sm font-medium transition hover:bg-muted">إلغاء</button>
      </div>
    </form>
    </Form>
  );
}
