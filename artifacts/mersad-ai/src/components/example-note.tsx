import { Info } from 'lucide-react';

export function ExampleNote({ text }: { text?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-accent bg-accent/60 px-4 py-3 text-sm text-accent-foreground" data-testid="note-example-data">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="leading-relaxed">{text ?? "السجلات الأولية في التطبيق هي بيانات مثال توضيحية. يمكنك تعديلها أو حذفها وإضافة معاملاتك الحقيقية."}</p>
    </div>
  );
}
