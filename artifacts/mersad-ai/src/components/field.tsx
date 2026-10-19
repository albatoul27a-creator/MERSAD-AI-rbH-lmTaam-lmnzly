import { type ReactNode } from 'react';

export const fieldCls = 'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <div className="mt-1.5 font-normal">{children}</div>
      {hint && !error && <p className="mt-1 text-xs font-normal text-muted-foreground">{hint}</p>}
      {error && <p className="mt-1 text-xs font-normal text-destructive">{error}</p>}
    </label>
  );
}

export function PageHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="rise flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-bold">{title}</h1>
      </div>
      {children}
    </header>
  );
}

export const primaryBtn = 'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[.98] disabled:opacity-60';
export const ghostBtn = 'inline-flex items-center justify-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted active:scale-[.98]';
