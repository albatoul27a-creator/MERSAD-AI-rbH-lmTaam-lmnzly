import { useState } from 'react';
import { Link } from 'wouter';
import { ChefHat, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  useCreateDish, useDeleteDish, useGetKitchenState, useUpdateDish,
  type Dish, type DishInput,
} from '@workspace/api-client-react';
import { ConfirmDelete } from '@/components/confirm-delete';
import { DishForm } from '@/components/dish-form';
import { PageHead, ghostBtn, primaryBtn } from '@/components/field';
import { Empty, KitchenGate } from '@/components/kitchen-gate';
import { KitchenNote } from '@/components/kitchen-note';
import { Modal } from '@/components/modal';
import { ProfitRow } from '@/components/profit-row';
import { useInvalidateKitchen } from '@/hooks/use-kitchen-actions';
import { useToast } from '@/hooks/use-toast';
import { kwd } from '@/lib/format';
import { errMsg, unitLabel } from '@/lib/kitchen';

export default function Dishes() {
  const q = useGetKitchenState();
  const inv = useInvalidateKitchen();
  const { toast } = useToast();
  const create = useCreateDish();
  const update = useUpdateDish();
  const del = useDeleteDish();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Dish | null>(null);
  const [deleting, setDeleting] = useState<Dish | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const close = () => { setCreating(false); setEditing(null); setFormError(null); };
  function save(v: DishInput) {
    setFormError(null);
    const cb = {
      onSuccess: () => { inv(); close(); toast({ title: editing ? 'تم حفظ الطبق' : 'تمت إضافة الطبق' }); },
      onError: (e: unknown) => setFormError(errMsg(e)),
    };
    if (editing) update.mutate({ id: editing.id, data: v }, cb);
    else create.mutate({ data: v }, cb);
  }
  function remove() {
    if (!deleting) return;
    del.mutate({ id: deleting.id }, {
      onSuccess: () => { inv(); setDeleting(null); toast({ title: 'تم حذف الطبق' }); },
      onError: (e) => { setDeleting(null); toast({ title: 'تعذر حذف الطبق', description: errMsg(e), variant: 'destructive' }); },
    });
  }

  return (
    <div className="space-y-6">
      <PageHead eyebrow="وصفات وتكلفة" title="الأطباق">
        <button onClick={() => setCreating(true)} data-testid="button-add-dish" className={primaryBtn}><Plus className="h-4 w-4" /> طبق جديد</button>
      </PageHead>
      <KitchenNote />
      <p className="text-sm leading-relaxed text-muted-foreground">كل وصفة تمثل طبقاً واحداً أو حصة واحدة تُباع. التكلفة = مجموع تكلفة المكونات (مع الهدر) + التغليف.</p>
      <KitchenGate query={q}>
        {(s) => s.dishes.length === 0 ? (
          <Empty icon={<ChefHat className="h-6 w-6" />} title="لا توجد أطباق بعد" text={s.ingredients.length === 0 ? 'ابدأ بإضافة المكونات، ثم ركّب منها أول طبق.' : 'ركّب أول طبق من مكوناتك لتعرف تكلفته وربحه على كل قناة.'}>
            {s.ingredients.length === 0
              ? <Link href="/ingredients" className={ghostBtn} data-testid="link-go-ingredients">الذهاب إلى المكونات</Link>
              : <button onClick={() => setCreating(true)} className={primaryBtn} data-testid="button-add-dish-empty"><Plus className="h-4 w-4" /> إضافة أول طبق</button>}
          </Empty>
        ) : (
          <ul className="space-y-5">
            {s.dishes.map((d, idx) => (
              <li key={d.id} data-testid={'card-dish-' + d.id} style={{ animationDelay: idx * 40 + 'ms' }} className="rise group rounded-2xl border bg-card p-5 transition hover:shadow-md md:p-7">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold" data-testid={'text-dish-name-' + d.id}>{d.name}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">تكلفة وبيع طبق واحد</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(d)} aria-label="تعديل" data-testid={'button-edit-dish-' + d.id} className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setDeleting(d)} aria-label="حذف" data-testid={'button-delete-dish-' + d.id} className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">تكلفة الطبق</p><p className="num mt-1 font-bold text-primary" data-testid={'text-dish-cogs-' + d.id}>{kwd(d.totalCost)}</p></div>
                  <div className="rounded-xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">مكونات</p><p className="num mt-1 font-semibold">{kwd(d.ingredientCost)}</p></div>
                  <div className="rounded-xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">تغليف</p><p className="num mt-1 font-semibold">{kwd(d.packagingCost)}</p></div>
                </div>
                <ul className="mt-4 divide-y rounded-xl border text-sm">
                  {d.items.map((it) => (
                    <li key={it.ingredientId} className="flex justify-between gap-3 px-3 py-2">
                      <span>{it.ingredientName} <span className="text-muted-foreground"><span className="num">{it.quantity}</span> {unitLabel[it.unit]}</span></span>
                      <span className="num font-medium">{kwd(it.cost)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {d.profits.map((p) => <ProfitRow key={p.channelId} p={p} dishId={d.id} />)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </KitchenGate>
      <Modal wide open={creating || !!editing} onClose={close} title={editing ? 'تعديل الطبق' : 'طبق جديد'}>
        {q.data && <DishForm key={editing?.id ?? 'new'} initial={editing ?? undefined} state={q.data} busy={create.isPending || update.isPending} error={formError} onSubmit={save} onCancel={close} />}
      </Modal>
      <ConfirmDelete open={!!deleting} title="حذف الطبق" busy={del.isPending} onClose={() => setDeleting(null)} onConfirm={remove}
        text={'سيتم حذف «' + (deleting?.name ?? '') + '» ووصفته نهائياً، ولا يمكن التراجع.'} />
    </div>
  );
}
