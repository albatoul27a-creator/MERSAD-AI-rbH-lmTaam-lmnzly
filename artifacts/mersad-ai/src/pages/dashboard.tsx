import { Link } from 'wouter';
import { ArrowDownLeft, ArrowUpRight, Plus, RefreshCw } from 'lucide-react';
import { useGetDashboardSummary } from '@workspace/api-client-react';
import { ExampleNote } from '@/components/example-note';
import { kwd, monthLabel, num, pct } from '@/lib/format';

function Change({ v }: { v: number }) {
  const up = v >= 0;
  return (
    <span className={'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ' + (up ? 'bg-accent text-accent-foreground' : 'bg-destructive/10 text-destructive')}>
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
      <span className="num">{pct(v)}</span>
    </span>
  );
}

export default function Dashboard() {
  const { data, isLoading, isError, refetch } = useGetDashboardSummary();

  const max = data ? Math.max(1, ...data.trend.flatMap((t) => [t.income, t.expense])) : 1;

  return (
    <div className="space-y-8">
      <header className="rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">نظرة عامة على الشهر الحالي</p>
          <h1 className="mt-1 text-3xl font-bold">كم ربحت فعلاً؟</h1>
        </div>
        <Link href="/transactions" data-testid="link-add-transaction" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[.98]">
          <Plus className="h-4 w-4" /> إدارة المعاملات
        </Link>
      </header>
      <ExampleNote />

      {isError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center" data-testid="state-error">
          <p className="font-medium">تعذر تحميل الملخص المالي</p>
          <button onClick={() => refetch()} data-testid="button-retry" className="mt-3 inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm transition hover:bg-muted">
            <RefreshCw className="h-4 w-4" /> إعادة المحاولة
          </button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-6" data-testid="state-loading">
          <div className="skel h-44" />
          <div className="grid gap-4 sm:grid-cols-2"><div className="skel h-28" /><div className="skel h-28" /></div>
          <div className="skel h-72" />
        </div>
      )}

      {data && (
        <>
          <section className="rise rounded-3xl bg-primary p-7 text-primary-foreground md:p-9" style={{ animationDelay: '60ms' }}>
            <div className="flex items-center justify-between">
              <p className="text-sm opacity-80">صافي الربح</p>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs"><span className="num">{pct(data.profitChangePercent)}</span> عن الشهر السابق</span>
            </div>
            <p className="mt-4 text-4xl font-bold md:text-5xl" data-testid="text-net-profit"><span className="num">{num(data.netProfit)}</span> <span className="text-xl font-medium opacity-80">د.ك</span></p>
            <p className="mt-3 text-sm opacity-75">بعد خصم المصروفات من الدخل، من <span className="num">{data.transactionCount}</span> معاملة.</p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            {[
              { k: 'income', label: 'الدخل', v: data.income, c: data.incomeChangePercent, show: true },
              { k: 'expense', label: 'المصروفات', v: data.expense, c: 0, show: false },
            ].map((s, i) => (
              <div key={s.k} className="rise rounded-2xl border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-md" style={{ animationDelay: 120 + i * 60 + 'ms' }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  {s.show && <Change v={s.c} />}
                </div>
                <p className="mt-3 text-2xl font-bold" data-testid={'text-' + s.k}>{kwd(s.v)}</p>
              </div>
            ))}
          </section>

          <section className="rise rounded-2xl border bg-card p-6 md:p-8" style={{ animationDelay: '240ms' }}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">الدخل والمصروفات شهرياً</h2>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-primary" />الدخل</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-chart-2" />المصروفات</span>
              </div>
            </div>
            {data.trend.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground" data-testid="state-empty-trend">لا توجد بيانات كافية لعرض الاتجاه بعد. أضف معاملات لتبدأ.</p>
            ) : (
              <div className="flex h-56 items-end justify-around gap-3" data-testid="chart-trend">
                {data.trend.map((t) => (
                  <div key={t.month} className="group flex h-full flex-1 flex-col items-center justify-end gap-2" title={'دخل ' + kwd(t.income) + ' / مصروف ' + kwd(t.expense)}>
                    <div className="flex h-full w-full items-end justify-center gap-1.5">
                      <div className="bar w-full max-w-7 rounded-t-lg bg-primary transition-opacity group-hover:opacity-80" style={{ height: (t.income / max) * 100 + '%' }} />
                      <div className="bar w-full max-w-7 rounded-t-lg bg-chart-2 transition-opacity group-hover:opacity-80" style={{ height: (t.expense / max) * 100 + '%' }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{monthLabel(t.month)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
