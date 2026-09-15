import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookGrid } from '@/components/books/BookGrid';
import { ButtonLink } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useBooks } from '@/hooks/useBooks';
import { useLibrary } from '@/hooks/useLibrary';
import { useAllReadingProgress } from '@/hooks/useReadingProgress';
import type { Book } from '@/types/book';

function pickBooks(books: Book[], ids: string[]) {
  const byId = new Map(books.map((book) => [book.id, book]));
  return ids.map((id) => byId.get(id)).filter((book): book is Book => Boolean(book));
}

export function LibraryPage() {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const { books } = useBooks();
  const { favoriteIds, plannedIds, loading } = useLibrary();
  const { map } = useAllReadingProgress();

  const liked = pickBooks(books, favoriteIds);
  const planned = pickBooks(books, plannedIds);
  const historyIds = Object.entries(map)
    .sort((a, b) => b[1].lastReadAt.localeCompare(a[1].lastReadAt))
    .map(([id]) => id);
  const history = pickBooks(books, historyIds);

  if (isLoading) {
    return <div className="min-h-[40vh]" />;
  }

  if (!user) {
    return (
      <Container className="py-16">
        <DocumentTitle title={t('library.title')} noindex />
        <EmptyState
          title={t('library.guestTitle')}
          description={t('library.guestHint')}
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/login?next=/library">{t('auth.loginSubmit')}</ButtonLink>
              <ButtonLink to="/register?next=/library" variant="secondary">
                {t('auth.registerSubmit')}
              </ButtonLink>
            </div>
          }
        />
      </Container>
    );
  }

  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email;

  return (
    <Container className="py-12 sm:py-16">
      <DocumentTitle title={t('library.title')} noindex />
      <p className="font-display text-xs tracking-[0.24em] text-accent uppercase">{t('library.eyebrow')}</p>
      <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-ink sm:text-5xl">
        {t('library.title')}
      </h1>
      <p className="mt-3 max-w-2xl text-base text-muted">{t('library.hello', { name })}</p>

      <Shelf
        title={t('library.liked')}
        empty={t('library.likedEmpty')}
        books={liked}
        loading={loading}
      />
      <Shelf
        title={t('library.planned')}
        empty={t('library.plannedEmpty')}
        books={planned}
        loading={loading}
      />
      <Shelf
        title={t('library.history')}
        empty={t('library.historyEmpty')}
        books={history}
        loading={false}
      />
    </Container>
  );
}

function Shelf({
  title,
  empty,
  books,
  loading,
}: {
  title: string;
  empty: string;
  books: Book[];
  loading: boolean;
}) {
  const { t } = useTranslation();

  return (
    <section className="mt-12">
      <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">{title}</h2>
      {loading ? (
        <div className="mt-5">
          <BookGrid books={[]} isLoading />
        </div>
      ) : books.length > 0 ? (
        <div className="mt-5">
          <BookGrid books={books} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">
          {empty}{' '}
          <Link to="/books" className="font-semibold text-ink hover:text-accent">
            {t('library.toCatalog')}
          </Link>
        </p>
      )}
    </section>
  );
}
