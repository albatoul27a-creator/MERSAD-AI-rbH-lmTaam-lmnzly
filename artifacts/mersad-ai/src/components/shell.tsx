import { type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, ReceiptText } from 'lucide-react';

const items = [
  { href: '/', label: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/transactions', label: 'المعاملات', icon: ReceiptText },
];

export function Shell({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  return (
    <div className="min-h-[100dvh] md:flex">
      <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-l bg-sidebar p-6 sticky top-0 h-[100dvh]">
        <Link href="/" className="mb-10 flex items-center gap-3" data-testid="link-logo">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">م</span>
          <span className="leading-tight">
            <span className="block text-lg font-bold">مرصاد</span>
            <span className="block text-xs text-muted-foreground">رفيقك المالي للمطبخ المنزلي</span>
          </span>
        </Link>
        <nav className="flex flex-col gap-1">
          {items.map((i) => {
            const on = loc === i.href;
            return (
              <Link key={i.href} href={i.href} data-testid={'link-nav-' + i.href.replace('/', '') || 'link-nav-home'}
                className={'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ' + (on ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:-translate-x-0.5')}>
                <i.icon className="h-4 w-4" />
                {i.label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto text-xs leading-relaxed text-muted-foreground">كل المبالغ بالدينار الكويتي (د.ك) بثلاث خانات عشرية.</p>
      </aside>
      <div className="flex-1 min-w-0 pb-24 md:pb-0">
        <main className="mx-auto w-full max-w-5xl px-5 py-8 md:px-10 md:py-12">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-card/95 backdrop-blur md:hidden">
        {items.map((i) => (
          <Link key={i.href} href={i.href} data-testid={'link-mobile-' + (i.href === '/' ? 'home' : 'transactions')}
            className={'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ' + (loc === i.href ? 'text-primary' : 'text-muted-foreground')}>
            <i.icon className="h-5 w-5" />
            {i.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
