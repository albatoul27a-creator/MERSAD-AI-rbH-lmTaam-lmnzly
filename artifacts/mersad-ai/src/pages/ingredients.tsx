import { useState } from 'react';
import { Pencil, Plus, Trash2, TrendingDown, TrendingUp, Wheat } from 'lucide-react';
import {
  useCreateIngredient, useDeleteIngredient, useGetKitchenState, useUpdateIngredient,
  type Ingredient, type IngredientInput,
} from '@workspace/api-client-react';
import { ConfirmDelete } from '@/components/confirm-delete';
import { Empty, KitchenGate } from '@/components/kitchen-gate';
import { PageHead, primaryBtn } from '@/components/field';
import { IngredientForm } from '@/components/ingredient-form';
import { KitchenNote } from '@/components/kitchen-note';
import { Modal } from '@/components/modal';
import { useInvalidateKitchen } from '@/hooks/use-kitchen-actions';
import { useToast } from '@/hooks/use-toast';
import { kwd } from '@/lib/format';
import { errMsg, unitLabel } from '@/lib/kitchen';

export default function Ingredients() {
  const q = useGetKitchenState();
  const inv = useInvalidateKitchen();
  const { toast } = useToast();
  const create = useCreateIngredient();
  const update = useUpdateIngredient();
  const del = useDeleteIngredient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [deleting, setDeleting] = useState<Ingredient | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const close = () => { setCreating(false); setEditing(null); setFormError(null); };
  function save(v: IngredientInput) {
    setFormError(null);
    const cb = {
      onSuccess: () => { inv(); close(); toast({ title: editing ? 'تم حفظ المكون' : 'تمت إضافة المكون' }); },
      onError: (e: unknown) => setFormError(errMsg(e)),
    };
    if (editing) update.mutate({ id: editing.id, data: v }, cb);
    else create.mutate({ data: v }, cb);
  }
  function remove() {
    if (!deleting) return;
    del.mutate({ id: deleting.id }, {
      onSuccess: () => { inv(); setDeleting(null); toast({ title: 'تم حذف المكون' }); },
      onError: (e) => { setDeleting(null); toast({ title: 'تعذر حذف المكون', description: errMsg(e), variant: 'destructive' }); },
    });
  }

  return (
    <div className="space-y-6">
      <PageHead eyebrow="مواد الشراء" title="المكونات">
        <button onClick={() => setCreating(true)} data-testid="button-add-ingredient" className={primaryBtn}><Plus className="h-4 w-4" /> مكون جديد</button>
      </PageHead>
      <KitchenNote />
      <p className="text-sm leading-relaxed text-muted-foreground">السعر هو سعر شراء وحدة واحدة من الوحدة المختارة. تُضاف نسبة الهدر تلقائياً إلى تكلفة كل وصفة.</p>
      <KitchenGate query={q}>
        {(s) => s.ingredients.length === 0 ? (
          <Empty icon={<Wheat className="h-6 w-6" />} title="لا توجد مكونات بعد" text="أضف مكوناتك وأسعار شرائها لتحسب تكلفة كل طبق.">
            <button onClick={() => setCreating(true)} className={primaryBtn} data-testid="button-add-ingredient-empty"><Plus className="h-4 w-4" /> إضافة أول مكون</button>
          </Empty>
        ) : (
          <ul className="space-y-3">
            {s.ingredients.map((i, idx) => {
              const changed = i.previousPrice !== null && i.priceChangePercent !== 0;
              const up = i.priceChangePercent > 0;
              return (
                <li key={i.id} data-testid={'row-ingredient-' + i.id} style={{ animationDelay: idx * 30 + 'ms' }}
                  className="rise group rounded-2xl border bg-card p-4 transition hover:shadow-md md:px-6">
                  <div className="flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold" data-testid={'text-ingredient-name-' + i.id}>{i.name}</p>
                      <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                        <span>هدر <span className="num">{i.wastePercent}%</span></span>
                        <span>{i.usedByCount > 0 ? 'يُستخدم في ' + i.usedByCount + ' وصفة' : 'غير مستخدم'}</span>
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold" data-testid={'text-ingredient-price-' + i.id}><span className="num">{kwd(i.price)}</span></p>
                      <p className="text-xs text-muted-foreground">لكل {unitLabel[i.unit]}</p>
                    </div>
                    <div className="flex gap-1 transition md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                      <button onClick={() => setEditing(i)} aria-label="تعديل" data-testid={'button-edit-ingredient-' + i.id} className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleting(i)} aria-label="حذف" data-testid={'button-delete-ingredient-' + i.id} className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  {changed && (
                    <p className={'mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ' + (up ? 'bg-destructive/5 text-destructive' : 'bg-accent text-accent-foreground')} data-testid={'text-price-change-' + i.id}>
                      {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      <span>{up ? 'ارتفع السعر' : 'انخفض السعر'} من <span className="num font-semibold">{kwd(i.previousPrice as number)}</span> إلى <span className="num font-semibold">{kwd(i.price)}</span> (<span className="num">{i.priceChangePercent > 0 ? '+' : ''}{i.priceChangePercent.toFixed(1)}%</span>)</span>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </KitchenGate>
      <Modal open={creating || !!editing} onClose={close} title={editing ? 'تعديل المكون' : 'مكون جديد'}>
        <IngredientForm key={editing?.id ?? 'new'} initial={editing ?? undefined} busy={create.isPending || update.isPending} error={formError} onSubmit={save} onCancel={close} />
      </Modal>
      <ConfirmDelete open={!!deleting} title="حذف المكون" busy={del.isPending} onClose={() => setDeleting(null)} onConfirm={remove}
        text={'سيتم حذف «' + (deleting?.name ?? '') + '». إذا كان مستخدماً في وصفة فسيرفض النظام الحذف حتى تزيله منها.'} />
    </div>
  );
}
