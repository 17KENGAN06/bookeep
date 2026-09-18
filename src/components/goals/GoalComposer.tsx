import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useToast } from '@/components/common/Toast';
import { formatLongDate } from '@/utils/dates';

type GoalComposerProps = {
  date: string;
  minDate: string;
  maxDate: string;
  pagesRead: number;
  targetPages: number | null;
  onDateChange: (date: string) => void;
  onSave: (target: number) => Promise<void>;
  onDelete: () => Promise<void>;
};

export function GoalComposer({
  date,
  minDate,
  maxDate,
  pagesRead,
  targetPages,
  onDateChange,
  onSave,
  onDelete,
}: GoalComposerProps) {
  const { t, i18n } = useTranslation();
  const { notify } = useToast();
  const [value, setValue] = useState(targetPages ?? 10);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setValue(targetPages ?? 10);
  }, [date, targetPages]);

  async function save() {
    setBusy(true);
    try {
      await onSave(Math.min(999, Math.max(1, value)));
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
    } catch {
      notify(t('goals.saveError'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      id="goal-composer"
      className="scroll-mt-24 rounded-3xl border-2 border-accent/35 bg-surface p-5 shadow-[var(--app-shadow)] sm:p-6 lg:sticky lg:top-24"
    >
      <p className="font-display text-xs tracking-[0.22em] text-accent uppercase">{t('goals.readingGoal')}</p>
      <h2 className="font-display mt-2 text-xl font-semibold text-ink">{t('goals.composerTitle')}</h2>
      <p className="mt-2 text-sm text-muted">{t('goals.composerLead')}</p>

      <label className="mt-5 block">
        <span className="text-xs font-semibold tracking-wide text-muted uppercase">{t('goals.pickDate')}</span>
        <input
          type="date"
          min={minDate}
          max={maxDate}
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
          className="focus-ring mt-1.5 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm font-semibold text-ink"
        />
      </label>
      <p className="mt-2 text-sm text-ink">{formatLongDate(date, i18n.resolvedLanguage ?? 'en')}</p>

      <p className="mt-5 text-sm text-muted">{t('goals.howMany')}</p>
      <div className="mt-3 flex items-center justify-center gap-3">
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

      <div className="mt-6 flex flex-col gap-2">
        <Button type="button" onClick={() => void save()} isLoading={busy}>
          {targetPages ? t('goals.editGoal') : t('goals.setGoal')}
        </Button>
        {targetPages ? (
          <Button type="button" variant="ghost" onClick={() => void remove()} disabled={busy}>
            <Trash2 className="h-4 w-4" />
            {t('goals.deleteGoal')}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
