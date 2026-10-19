import { Info } from 'lucide-react';

export function ExampleNote() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-accent bg-accent/60 px-4 py-3 text-sm text-accent-foreground" data-testid="note-example-data">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="leading-relaxed">هذه نسخة تجريبية مشتركة بسجلات توضيحية قابلة للتعديل والحذف. جرّبي إضافة معاملات نموذجية، ولا تدخلي بيانات مالية حساسة قبل تفعيل الحسابات الخاصة.</p>
    </div>
  );
}
