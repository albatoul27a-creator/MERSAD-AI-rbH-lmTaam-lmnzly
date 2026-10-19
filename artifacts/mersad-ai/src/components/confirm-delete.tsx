import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/modal';

export function ConfirmDelete({ open, title, text, busy, onConfirm, onClose }: {
  open: boolean; title: string; text: string; busy: boolean; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
      <div className="mt-6 flex gap-3">
        <button onClick={onConfirm} disabled={busy} data-testid="button-confirm-delete" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground transition hover:opacity-90 disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} حذف
        </button>
        <button onClick={onClose} data-testid="button-cancel-delete" className="rounded-xl border px-5 py-2.5 text-sm font-medium transition hover:bg-muted">إلغاء</button>
      </div>
    </Modal>
  );
}
