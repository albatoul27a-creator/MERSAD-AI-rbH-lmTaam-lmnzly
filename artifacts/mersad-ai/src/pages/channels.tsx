import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { Link } from 'wouter';
import { ChefHat } from 'lucide-react';
import { useUpdateDeliveryChannel, useGetKitchenState, type DeliveryChannel } from '@workspace/api-client-react';
import { Field, PageHead, fieldCls, primaryBtn } from '@/components/field';
import { Empty, KitchenGate } from '@/components/kitchen-gate';
import { KitchenNote } from '@/components/kitchen-note';
import { ProfitRow } from '@/components/profit-row';
import { useInvalidateKitchen } from '@/hooks/use-kitchen-actions';
import { useToast } from '@/hooks/use-toast';
import { errMsg } from '@/lib/kitchen';
import { ghostBtn } from '@/components/field';

interface V { commissionPercent: string; fixedFee: string }

function ChannelCard({ c }: { c: DeliveryChannel }) {
  const inv = useInvalidateKitchen();
  const { toast } = useToast();
  const m = useUpdateDeliveryChannel();
  const form = useForm<V>({ defaultValues: { commissionPercent: String(c.commissionPercent), fixedFee: String(c.fixedFee) } });
  const { register, formState: { errors, isDirty } } = form;
  return (
    <Form {...form}>
      <form noValidate data-testid={'card-channel-' + c.id} className="rounded-2xl border bg-card p-5 transition hover:shadow-md"
        onSubmit={form.handleSubmit((v) => m.mutate({ id: c.id, data: { commissionPercent: Number(v.commissionPercent) || 0, fixedFee: Number(v.fixedFee) || 0 } }, {
          onSuccess: () => { inv(); form.reset(v); toast({ title: 'تم تحديث ' + c.name }); },
          onError: (e) => toast({ title: 'تعذر الحفظ', description: errMsg(e), variant: 'destructive' }),
        }))}>
        <h3 className="mb-4 font-bold">{c.name}</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="العمولة %" error={errors.commissionPercent?.message}>
            <input type="number" step="any" dir="ltr" className={fieldCls + ' text-right'} data-testid={'input-commission-' + c.id}
              {...register('commissionPercent', { validate: (v) => (Number(v) >= 0 && Number(v) <= 95) || 'بين 0 و95' })} />
          </Field>
          <Field label="رسم ثابت (د.ك)" error={errors.fixedFee?.message}>
            <input type="number" step="any" dir="ltr" className={fieldCls + ' text-right'} data-testid={'input-fee-' + c.id}
              {...register('fixedFee', { validate: (v) => Number(v || 0) >= 0 || 'لا يمكن أن يكون سالباً' })} />
          </Field>
        </div>
        <button type="submit" disabled={m.isPending || !isDirty} data-testid={'button-save-channel-' + c.id} className={primaryBtn + ' mt-4 w-full'}>
          {m.isPending && <Loader2 className="h-4 w-4 animate-spin" />} حفظ
        </button>
      </form>
    </Form>
  );
}

export default function Channels() {
  const q = useGetKitchenState();
  return (
    <div className="space-y-6">
      <PageHead eyebrow="مقارنة الربحية" title="قنوات البيع" />
      <KitchenNote />
      <KitchenGate query={q}>
        {(s) => (
          <>
            <section>
              <h2 className="mb-3 text-lg font-bold">العمولة والرسوم</h2>
              <p className="mb-4 text-sm text-muted-foreground">قيم توضيحية قابلة للتعديل، عدّلها حسب اتفاقك الفعلي مع كل منصة.</p>
              <div className="grid gap-4 md:grid-cols-3">
                {s.channels.map((c) => <ChannelCard key={c.id + '-' + c.commissionPercent + '-' + c.fixedFee} c={c} />)}
              </div>
            </section>
            <section className="space-y-4">
              <h2 className="text-lg font-bold">ربح كل طبق حسب القناة</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">الربح بعد تكلفة المكونات والهدر والتغليف وعمولة القناة ورسومها؛ لا يشمل مصروفات تشغيلية أخرى غير مدخلة.</p>
              {s.dishes.length === 0 ? (
                <Empty icon={<ChefHat className="h-6 w-6" />} title="لا توجد أطباق للمقارنة" text="أضف طبقاً لترى ربحه على المحلي وطلبات وديليفرو.">
                  <Link href="/dishes" className={ghostBtn} data-testid="link-go-dishes">الذهاب إلى الأطباق</Link>
                </Empty>
              ) : s.dishes.map((d) => (
                <div key={d.id} className="rounded-2xl border bg-card p-5 md:p-6" data-testid={'compare-dish-' + d.id}>
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <h3 className="font-bold">{d.name}</h3>
                    <p className="text-xs text-muted-foreground">طبق واحد</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {d.profits.map((p) => <ProfitRow key={p.channelId} p={p} dishId={d.id} />)}
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </KitchenGate>
    </div>
  );
}
