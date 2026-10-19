import type { ChannelProfit } from '@workspace/api-client-react';
import { kwd } from '@/lib/format';

export function ProfitRow({ p, dishId }: { p: ChannelProfit; dishId: number }) {
  const loss = p.profit < 0;
  return (
    <div className={'rounded-xl border p-4 transition ' + (loss ? 'border-destructive/30 bg-destructive/5' : 'bg-card hover:shadow-sm')} data-testid={'profit-' + dishId + '-' + p.channelId}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">{p.channelName}</p>
        <p className="text-sm text-muted-foreground">سعر البيع <span className="num font-medium text-foreground">{kwd(p.sellingPrice)}</span></p>
      </div>
      <p className={'mt-2 text-lg font-bold ' + (loss ? 'text-destructive' : 'text-primary')} data-testid={'text-profit-' + dishId + '-' + p.channelId}>
        {loss ? <>تخسر <span className="num">{kwd(-p.profit)}</span> على {p.channelName}</> : <>ربح <span className="num">{kwd(p.profit)}</span></>}
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground sm:grid-cols-4">
        <div><dt>العمولة</dt><dd className="num mt-0.5 text-sm text-foreground">{kwd(p.commission)}</dd></div>
        <div><dt>الرسم الثابت</dt><dd className="num mt-0.5 text-sm text-foreground">{kwd(p.fixedFee)}</dd></div>
        <div><dt>الهامش</dt><dd className={'mt-0.5 text-sm ' + (loss ? 'text-destructive' : 'text-foreground')}><span className="num">{p.marginPercent.toFixed(1)}%</span></dd></div>
        <div><dt>سعر التعادل</dt><dd className="num mt-0.5 text-sm text-foreground">{kwd(p.breakEvenPrice)}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-muted-foreground" data-testid={'text-suggested-' + dishId + '-' + p.channelId}>
        {p.suggestedPrice === null
          ? 'هامش 20% غير ممكن بعمولة هذه القناة الحالية.'
          : <>السعر المقترح لهامش 20%: <span className="num font-semibold text-foreground">{kwd(p.suggestedPrice)}</span></>}
      </p>
    </div>
  );
}
