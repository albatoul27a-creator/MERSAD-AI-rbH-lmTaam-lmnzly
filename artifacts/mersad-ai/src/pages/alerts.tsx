import { useEffect, useRef } from 'react';
import { BellOff, Loader2, Sparkles } from 'lucide-react';
import { useGenerateKitchenAdvice, useGetKitchenState } from '@workspace/api-client-react';
import { AlertCard } from '@/components/alert-card';
import { PageHead, ghostBtn, primaryBtn } from '@/components/field';
import { Empty, KitchenGate } from '@/components/kitchen-gate';
import { KitchenNote } from '@/components/kitchen-note';
import { errMsg } from '@/lib/kitchen';

export default function Alerts() {
  const q = useGetKitchenState();
  const advice = useGenerateKitchenAdvice();
  const resetRef = useRef(advice.reset);
  resetRef.current = advice.reset;

  // New kitchen data makes previous AI advice stale.
  useEffect(() => { resetRef.current(); }, [q.dataUpdatedAt]);

  return (
    <div className="space-y-6">
      <PageHead eyebrow="مراقبة التكلفة" title="التنبيهات والنصائح" />
      <KitchenNote />
      <KitchenGate query={q}>
        {(s) => (
          <>
            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-bold">تنبيهات القواعد</h2>
                <p className="mt-1 text-sm text-muted-foreground">تنبيهات تلقائية مبنية على حساب مباشر للتكلفة والعمولات، وليست من الذكاء الاصطناعي.</p>
              </div>
              {s.alerts.length === 0 ? (
                <Empty icon={<BellOff className="h-6 w-6" />} title="لا توجد تنبيهات حالياً" text="لا خسائر ولا ارتفاعات أسعار تستدعي الانتباه الآن." />
              ) : (
                <ul className="space-y-3">{s.alerts.map((a) => <AlertCard key={a.id} a={a} />)}</ul>
              )}
            </section>

            <section className="rounded-2xl border bg-card p-6 md:p-8" data-testid="section-ai-advice">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <h2 className="flex items-center gap-2 text-lg font-bold"><Sparkles className="h-5 w-5 text-primary" /> نصيحة تسعير بالذكاء الاصطناعي</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">تُولَّد عند طلبك فقط اعتماداً على بيانات مطبخك الحالية، وتُمسح تلقائياً عند تغيّر البيانات.</p>
                </div>
                <button onClick={() => advice.mutate(undefined)} disabled={advice.isPending} data-testid="button-generate-advice" className={primaryBtn}>
                  {advice.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {advice.data ? 'توليد نصيحة جديدة' : 'اطلب نصيحة التسعير'}
                </button>
              </div>
              {advice.isPending && (
                <div className="mt-6 space-y-2" data-testid="state-advice-loading">
                  <div className="skel h-4 w-full" /><div className="skel h-4 w-11/12" /><div className="skel h-4 w-4/5" /><div className="skel h-4 w-2/3" />
                </div>
              )}
              {advice.isError && (
                <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4" data-testid="state-advice-error">
                  <p className="text-sm text-destructive">{errMsg(advice.error, 'تعذر توليد النصيحة الآن.')}</p>
                  <button onClick={() => advice.mutate(undefined)} className={ghostBtn + ' mt-3'} data-testid="button-retry-advice">إعادة المحاولة</button>
                </div>
              )}
              {advice.data && !advice.isPending && (
                <div className="mt-6 rounded-xl bg-muted/60 p-5" data-testid="text-advice">
                  <p className="whitespace-pre-line text-sm leading-loose">{advice.data.advice}</p>
                  <p className="mt-4 text-xs text-muted-foreground">أُنشئت في {new Date(advice.data.generatedAt).toLocaleString('ar-KW-u-nu-latn')}</p>
                </div>
              )}
            </section>
          </>
        )}
      </KitchenGate>
    </div>
  );
}
