import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BookCover } from '@/components/books/BookCover';
import { ButtonLink } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/Field';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { useToast } from '@/components/common/Toast';
import { useAdminBooks } from '@/hooks/useAdminBooks';
import { deleteBook } from '@/services/books';
import type { Book } from '@/types/book';

export function AdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const { books, status, reload } = useAdminBooks();
  const { notify } = useToast();
  const [pending, setPending] = useState<Book | null>(null);
  const [deleting, setDeleting] = useState(false);

  const finnish = books.filter((book) => book.language === 'fi').length;
  const english = books.filter((book) => book.language === 'en').length;

  return (
    <div>
      <DocumentTitle title={t('admin.dashboard.title')} noindex />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-xs tracking-[0.2em] text-accent uppercase">{t('admin.eyebrow')}</p>
          <h1 className="font-display mt-2 text-3xl font-semibold text-ink">{t('admin.dashboard.title')}</h1>
        </div>
        <ButtonLink to="/admin/books/new">
          <Plus className="h-4 w-4" aria-hidden />
          {t('admin.dashboard.add')}
        </ButtonLink>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label={t('admin.dashboard.total')} value={books.length} />
        <Stat label={t('admin.dashboard.finnish')} value={finnish} />
        <Stat label={t('admin.dashboard.english')} value={english} />
      </div>

      <div className="mt-8">
        {status === 'error' ? (
          <ErrorState onRetry={() => void reload()} />
        ) : status === 'loading' ? (
          <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : books.length === 0 ? (
          <EmptyState title={t('admin.dashboard.empty')} />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-line text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t('admin.table.cover')}</th>
                  <th className="px-4 py-3 font-semibold">{t('admin.table.title')}</th>
                  <th className="px-4 py-3 font-semibold">{t('admin.table.language')}</th>
                  <th className="px-4 py-3 font-semibold">{t('admin.table.level')}</th>
                  <th className="px-4 py-3 font-semibold">{t('admin.table.status')}</th>
                  <th className="px-4 py-3 font-semibold">{t('admin.table.created')}</th>
                  <th className="px-4 py-3 font-semibold">{t('admin.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id} className="border-b border-line/70 last:border-0">
                    <td className="px-4 py-3">
                      <div className="h-16 w-12 overflow-hidden rounded-lg">
                        <BookCover book={book} />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">{book.title_original}</td>
                    <td className="px-4 py-3 text-muted">{t(`languages.${book.language}`)}</td>
                    <td className="px-4 py-3 text-muted">{book.level}</td>
                    <td className="px-4 py-3 text-muted">
                      {book.published ? t('admin.status.published') : t('admin.status.draft')}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(book.created_at).toLocaleDateString(i18n.resolvedLanguage)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/admin/books/${book.id}/edit`} className="focus-ring rounded-md text-sm font-semibold text-accent">
                          {t('admin.table.edit')}
                        </Link>
                        <button
                          type="button"
                          className="focus-ring rounded-md text-sm font-semibold text-muted hover:text-ink"
                          onClick={() => setPending(book)}
                        >
                          {t('admin.table.delete')}
                        </button>
                        {book.published ? (
                          <Link to={`/books/${book.slug}`} className="focus-ring rounded-md text-sm font-semibold text-muted hover:text-ink">
                            {t('admin.table.open')}
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pending)}
        title={t('admin.delete.title')}
        description={t('admin.delete.body', { title: pending?.title_original ?? '' })}
        confirmLabel={t('admin.delete.confirm')}
        cancelLabel={t('admin.delete.cancel')}
        isLoading={deleting}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          setDeleting(true);
          void deleteBook(pending)
            .then(() => {
              notify(t('admin.delete.success'));
              setPending(null);
              void reload();
            })
            .catch(() => notify(t('admin.delete.error'), 'error'))
            .finally(() => setDeleting(false));
        }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-xs tracking-[0.16em] text-muted uppercase">{label}</p>
      <p className="font-display mt-2 text-3xl font-semibold text-ink">{value}</p>
    </article>
  );
}
