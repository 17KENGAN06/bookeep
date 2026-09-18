import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useToast } from '@/components/common/Toast';
import { formatLongDate } from '@/utils/dates';

type GoalEditorProps = {
  date: string;
  pagesRead: number;
  targetPages: number | null;
  onSave: (target: number) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
};

export function GoalEditor({ date, pagesRead, targetPages, onSave, onDelete, onClose }: GoalEditorProps) {
  const { t, i18n } = useTranslation();
  const { notify } = useToast();
  const [value, setValue] = useState(targetPages ?? 10);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  async function save() {
    setBusy(true);
    try {
      await onSave(Math.min(999, Math.max(1, value)));
      onClose();
    } catch {
      notify(t('goals.saveError'), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await onDelete();
      onClose();
    } catch {
      notify(t('goals.saveError'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-bg/70 backdrop-blur-sm" aria-label={t('goals.close')} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-editor-title"
        className="relative w-full max-w-md rounded-t-3xl border border-line bg-surface p-5 shadow-[var(--app-shadow)] sm:rounded-3xl sm:p-6"
      >
        <p className="font-display text-xs tracking-[0.22em] text-accent uppercase">{t('goals.readingGoal')}</p>
        <h2 id="goal-editor-title" className="font-display mt-2 text-xl font-semibold text-ink">
          {formatLongDate(date, i18n.resolvedLanguage ?? 'en')}
        </h2>
        <p className="mt-2 text-sm text-muted">{t('goals.howMany')}</p>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-bg text-ink"
            onClick={() => setValue((current) => Math.max(1, current - 1))}
            aria-label={t('goals.decrease')}
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            min={1}
            max={999}
            value={value}
            onChange={(event) => setValue(Math.min(999, Math.max(1, Number(event.target.value) || 1)))}
            className="focus-ring w-24 rounded-xl border border-line bg-bg py-2.5 text-center font-display text-2xl font-semibold text-ink"
            aria-label={t('goals.targetPages')}
          />
          <button
            type="button"
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-bg text-ink"
            onClick={() => setValue((current) => Math.min(999, current + 1))}
            aria-label={t('goals.increase')}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-muted">{t('goals.alreadyRead', { count: pagesRead })}</p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {targetPages ? (
            <Button type="button" variant="ghost" onClick={() => void remove()} disabled={busy} className="sm:mr-auto">
              <Trash2 className="h-4 w-4" />
              {t('goals.deleteGoal')}
            </Button>
          ) : (
            <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
              {t('goals.close')}
            </Button>
          )}
          <Button type="button" onClick={() => void save()} isLoading={busy}>
            {t('goals.setGoal')}
          </Button>
        </div>
      </div>
    </div>
  );
}
