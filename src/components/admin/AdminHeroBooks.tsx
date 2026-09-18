import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/Button';
import { useToast } from '@/components/common/Toast';
import { setHomeHeroBooks } from '@/services/books';
import type { Book } from '@/types/book';

type AdminHeroBooksProps = {
  books: Book[];
  onSaved: () => Promise<void> | void;
};

export function AdminHeroBooks({ books, onSaved }: AdminHeroBooksProps) {
  const { t } = useTranslation();
  const { notify } = useToast();
  const published = books.filter((book) => book.published);
  const [slots, setSlots] = useState<[string, string, string]>(['', '', '']);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const next: [string, string, string] = ['', '', ''];
    for (const book of books) {
      if (book.hero_slot === 1 || book.hero_slot === 2 || book.hero_slot === 3) {
        next[book.hero_slot - 1] = book.id;
      }
    }
    setSlots(next);
  }, [books]);

  async function save() {
    const chosen = slots.filter(Boolean);
    if (new Set(chosen).size !== chosen.length) {
      notify(t('admin.hero.duplicate'), 'error');
      return;
    }
    setSaving(true);
    try {
      await setHomeHeroBooks([slots[0] || null, slots[1] || null, slots[2] || null]);
      await onSaved();
      notify(t('admin.hero.saved'));
    } catch {
      notify(t('admin.hero.error'), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="font-display text-xl font-semibold text-ink">{t('admin.hero.title')}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">{t('admin.hero.lead')}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {slots.map((value, index) => (
          <label key={index} className="block">
            <span className="text-xs font-semibold tracking-wide text-muted uppercase">
              {t('admin.hero.slot', { n: index + 1 })}
            </span>
            <select
              className="focus-ring mt-1.5 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink"
              value={value}
              onChange={(event) => {
                const next = [...slots] as [string, string, string];
                next[index] = event.target.value;
                setSlots(next);
              }}
            >
              <option value="">{t('admin.hero.empty')}</option>
              {published.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title_original}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <Button type="button" className="mt-5" isLoading={saving} onClick={() => void save()}>
        {t('admin.hero.save')}
      </Button>
    </section>
  );
}
