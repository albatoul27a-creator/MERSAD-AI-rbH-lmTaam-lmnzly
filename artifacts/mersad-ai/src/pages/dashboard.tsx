import { Link } from 'wouter';
import { ChefHat } from 'lucide-react';
import { useGetKitchenState } from '@workspace/api-client-react';
import { AlertCard } from '@/components/alert-card';
import { PageHead, ghostBtn, primaryBtn } from '@/components/field';
import { Empty, KitchenGate } from '@/components/kitchen-gate';
import { KitchenNote } from '@/components/kitchen-note';
import { kwd } from '@/lib/format';

export default function Dashboard() {
  const q = useGetKitchenState();
  return (
    <div className="space-y-8">
      <PageHead eyebrow="اقتصاديات أطباقك" title="كم يربح كل طبق فعلاً؟">
        <Link href="/dishes" className={primaryBtn} data-testid="link-go-dishes">إدارة الأطباق</Link>
      </PageHead>
      <KitchenNote />
      <KitchenGate query={q}>
        {(s) => {
          const pairs = s.dishes.flatMap((d) => d.profits.map((p) => ({ d, p })));
          const losses = pairs.filter((x) => x.p.profit < 0);
          const critical = s.alerts.filter((a) => a.severity !== 'info');
          if (s.dishes.length === 0) {
            return (
              <Empty icon={<ChefHat className="h-6 w-6" />} title="ابدأ بأول طبق" text="أضف المكونات ثم ركّب طبقاً لتظهر تكلفته وربحه على المحلي وطلبات وديليفرو.">
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/ingredients" className={ghostBtn} data-testid="link-go-ingredients">المكونات</Link>
                  <Link href="/dishes" className={primaryBtn} data-testid="link-go-dishes-empty">الأطباق</Link>
                </div>
              </Empty>
            );
          }
          return (
            <>
              <section className="grid gap-4 sm:grid-cols-3">
                {[
                  { k: 'dishes', l: 'أطباق مسجلة', v: String(s.dishes.length), bad: false },
                  { k: 'ingredients', l: 'مكونات', v: String(s.ingredients.length), bad: false },
                  { k: 'losses', l: 'حالات بيع بخسارة', v: String(losses.length), bad: losses.length > 0 },
                ].map((c, i) => (
                  <div key={c.k} style={{ animationDelay: i * 60 + 'ms' }} className={'rise rounded-2xl border p-6 transition hover:-translate-y-0.5 hover:shadow-md ' + (c.bad ? 'border-destructive/30 bg-destructive/5' : 'bg-card')}>
                    <p className="text-sm text-muted-foreground">{c.l}</p>
                    <p className={'num mt-3 text-3xl font-bold ' + (c.bad ? 'text-destructive' : 'text-primary')} data-testid={'text-stat-' + c.k}>{c.v}</p>
                  </div>
                ))}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">تنبيهات حرجة</h2>
                  <Link href="/alerts" className="text-sm text-primary underline-offset-4 hover:underline" data-testid="link-all-alerts">كل التنبيهات</Link>
                </div>
                {critical.length === 0
                  ? <p className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground" data-testid="text-no-critical">لا توجد تنبيهات حرجة الآن.</p>
                  : <ul className="space-y-3">{critical.slice(0, 5).map((a) => <AlertCard key={a.id} a={a} />)}</ul>}
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold">الأطباق وأضعف قناة لكل منها</h2>
                <ul className="space-y-3">
                  {s.dishes.map((d) => {
                    const worst = [...d.profits].sort((a, b) => a.profit - b.profit)[0];
                    const loss = worst && worst.profit < 0;
                    return (
                      <li key={d.id} data-testid={'row-dish-' + d.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border bg-card p-4 transition hover:shadow-md md:px-6">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{d.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">تكلفة الطبق <span className="num">{kwd(d.totalCost)}</span> / سعر البيع <span className="num">{kwd(d.sellingPrice)}</span></p>
                        </div>
                        {worst && (
                          <p className={'text-sm font-semibold ' + (loss ? 'text-destructive' : 'text-primary')}>
                            {loss ? <>تخسر <span className="num">{kwd(-worst.profit)}</span> على {worst.channelName}</> : <>أقل ربح <span className="num">{kwd(worst.profit)}</span> على {worst.channelName}</>}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            </>
          );
        }}
      </KitchenGate>
    </div>
  );
}
