import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Pencil, Plus, RefreshCw, Search, Trash2, WalletCards } from 'lucide-react';
import {
  getGetDashboardSummaryQueryKey,
  getGetTransactionsQueryKey,
  useCreateTransaction,
  useDeleteTransaction,
  useGetTransactions,
  useUpdateTransaction,
  type GetTransactionsParams,
  type Transaction,
} from '@workspace/api-client-react';
import { ExampleNote } from '@/components/example-note';
import { Modal } from '@/components/modal';
import { TransactionForm, type FormValues } from '@/components/transaction-form';
import { useToast } from '@/hooks/use-toast';
import { dateLabel, kwd } from '@/lib/format';

const tabs = [
  { v: '', label: 'الكل' },
  { v: 'income', label: 'الدخل' },
  { v: 'expense', label: 'المصروفات' },
];

export default function Transactions() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [type, setType] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState('');
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const params: GetTransactionsParams = {};
  if (type === 'income' || type === 'expense') params.type = type;
  if (search) params.search = search;
  if (month) params.month = month;

  const { data, isLoading, isError, refetch } = useGetTransactions(params);
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const del = useDeleteTransaction();

  const refresh = () => {
    qc.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  };
  const closeForm = () => { setCreating(false); setEditing(null); setFormError(null); };

  function save(v: FormValues) {
    setFormError(null);
    const body = { type: v.type, title: v.title, category: v.category, amount: v.amount, transactionDate: v.transactionDate };
    const fail = () => setFormError('تعذر حفظ المعاملة، حاول مرة أخرى.');
    if (editing) {
      update.mutate({ id: editing.id, data: { ...body, note: v.note || null } }, {
        onSuccess: () => { refresh(); closeForm(); toast({ title: 'تم حفظ التعديلات' }); }, onError: fail,
      });
    } else {
      create.mutate({ data: { ...body, ...(v.note ? { note: v.note } : {}) } }, {
        onSuccess: () => { refresh(); closeForm(); toast({ title: 'تمت إضافة المعاملة' }); }, onError: fail,
      });
    }
  }

  function confirmDelete() {
    if (!deleting) return;
    del.mutate({ id: deleting.id }, {
      onSuccess: () => { refresh(); setDeleting(null); toast({ title: 'تم حذف المعاملة' }); },
      onError: () => toast({ title: 'تعذر حذف المعاملة', variant: 'destructive' }),
    });
  }

  const filtered = !!(type || search || month);
  const input = 'rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

  return (
    <div className="space-y-6">
      <header className="rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">الدخل والمصروفات</p>
          <h1 className="mt-1 text-3xl font-bold">المعاملات</h1>
        </div>
        <button onClick={() => setCreating(true)} data-testid="button-add-transaction" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[.98]">
          <Plus className="h-4 w-4" /> معاملة جديدة
        </button>
      </header>
      <ExampleNote />

      <div className="rise flex flex-wrap items-center gap-3" style={{ animationDelay: '60ms' }}>
        <div className="flex rounded-xl bg-muted p-1">
          {tabs.map((t) => (
            <button key={t.v} onClick={() => setType(t.v)} data-testid={'filter-type-' + (t.v || 'all')}
              className={'rounded-lg px-4 py-1.5 text-sm font-medium transition-all ' + (type === t.v ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="ابحث بالعنوان أو التصنيف" data-testid="input-search" className={input + ' w-full pr-10'} />
        </div>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} data-testid="input-month" className={input} aria-label="الشهر" />
        {filtered && (
          <button onClick={() => { setType(''); setSearchInput(''); setMonth(''); }} data-testid="button-clear-filters" className="text-sm text-primary underline-offset-4 hover:underline">مسح التصفية</button>
        )}
      </div>

      {isError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center" data-testid="state-error">
          <p className="font-medium">تعذر تحميل المعاملات</p>
          <button onClick={() => refetch()} data-testid="button-retry" className="mt-3 inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm transition hover:bg-muted">
            <RefreshCw className="h-4 w-4" /> إعادة المحاولة
          </button>
        </div>
      )}
      {isLoading && <div className="space-y-3" data-testid="state-loading">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skel h-20" />)}</div>}

      {data && data.length === 0 && (
        <div className="rounded-2xl border border-dashed bg-card px-6 py-16 text-center" data-testid="state-empty">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground"><WalletCards className="h-6 w-6" /></span>
          <p className="mt-4 font-semibold">{filtered ? 'لا توجد نتائج مطابقة' : 'لا توجد معاملات بعد'}</p>
          <p className="mt-1 text-sm text-muted-foreground">{filtered ? 'جرّب تغيير التصفية أو كلمة البحث.' : 'سجّل أول دخل أو مصروف لتبدأ برؤية ربحك.'}</p>
        </div>
      )}

      {data && data.length > 0 && (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {data.map((t) => (
              <motion.li layout key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.2 }}
                data-testid={'row-transaction-' + t.id}
                className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition hover:shadow-md md:px-6">
                <span className={'h-10 w-1 shrink-0 rounded-full ' + (t.type === 'income' ? 'bg-primary' : 'bg-chart-2')} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold" data-testid={'text-title-' + t.id}>{t.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span className="rounded-md bg-muted px-2 py-0.5">{t.category}</span>
                    <span>{dateLabel(t.transactionDate)}</span>
                    {t.note && <span className="truncate">{t.note}</span>}
                  </p>
                </div>
                <div className="text-left">
                  <p className={'text-base font-bold ' + (t.type === 'income' ? 'text-primary' : 'text-muted-foreground')} data-testid={'text-amount-' + t.id}>
                    <span className="num">{t.type === 'income' ? '+' : '-'}{kwd(t.amount)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{t.type === 'income' ? 'دخل' : 'مصروف'}</p>
                </div>
                <div className="flex gap-1 transition md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                  <button onClick={() => setEditing(t)} aria-label="تعديل" data-testid={'button-edit-' + t.id} className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDeleting(t)} aria-label="حذف" data-testid={'button-delete-' + t.id} className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Modal open={creating || !!editing} onClose={closeForm} title={editing ? 'تعديل المعاملة' : 'معاملة جديدة'}>
        <TransactionForm key={editing?.id ?? 'new'} initial={editing ?? undefined} busy={create.isPending || update.isPending} error={formError} onSubmit={save} onCancel={closeForm} />
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="حذف المعاملة">
        <p className="text-sm leading-relaxed text-muted-foreground">سيتم حذف «{deleting?.title}» نهائياً وتحديث ملخصك المالي. لا يمكن التراجع عن هذا الإجراء.</p>
        <div className="mt-6 flex gap-3">
          <button onClick={confirmDelete} disabled={del.isPending} data-testid="button-confirm-delete" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground transition hover:opacity-90 disabled:opacity-60">
            {del.isPending && <Loader2 className="h-4 w-4 animate-spin" />} حذف
          </button>
          <button onClick={() => setDeleting(null)} data-testid="button-cancel-delete" className="rounded-xl border px-5 py-2.5 text-sm font-medium transition hover:bg-muted">إلغاء</button>
        </div>
      </Modal>
    </div>
  );
}
