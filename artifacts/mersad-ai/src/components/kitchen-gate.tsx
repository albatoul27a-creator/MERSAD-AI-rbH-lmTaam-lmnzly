import { type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import type { KitchenState } from '@workspace/api-client-react';
import { ghostBtn } from '@/components/field';

export function KitchenGate({ query, children }: {
  query: { data?: KitchenState; isLoading: boolean; isError: boolean; refetch: () => unknown };
  children: (s: KitchenState) => ReactNode;
}) {
  if (query.isLoading) {
    return (
      <div className="space-y-3" data-testid="state-loading">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skel h-24" />)}
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center" data-testid="state-error">
        <p className="font-medium">تعذر تحميل بيانات المطبخ</p>
        <button onClick={() => query.refetch()} data-testid="button-retry" className={ghostBtn + ' mt-4'}>
          <RefreshCw className="h-4 w-4" /> إعادة المحاولة
        </button>
      </div>
    );
  }
  return <>{children(query.data)}</>;
}

export function Empty({ icon, title, text, children }: { icon: ReactNode; title: string; text: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card px-6 py-14 text-center" data-testid="state-empty">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground">{icon}</span>
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
