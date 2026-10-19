import { AlertTriangle, Info, TrendingUp } from 'lucide-react';
import type { KitchenAlert } from '@workspace/api-client-react';

const tone = {
  danger: 'border-destructive/30 bg-destructive/5 text-destructive',
  warning: 'border-[hsl(36_70%_80%)] bg-[hsl(38_80%_96%)] text-[hsl(30_65%_28%)]',
  info: 'border-accent bg-accent/60 text-accent-foreground',
} as const;

export function AlertCard({ a }: { a: KitchenAlert }) {
  const Icon = a.severity === 'danger' ? AlertTriangle : a.kind === 'price_increase' ? TrendingUp : Info;
  return (
    <li className={'flex gap-3 rounded-2xl border p-4 transition hover:shadow-sm ' + tone[a.severity]} data-testid={'alert-' + a.id}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">{a.title}</p>
        <p className="mt-1 text-sm leading-relaxed opacity-90">{a.message}</p>
      </div>
    </li>
  );
}
