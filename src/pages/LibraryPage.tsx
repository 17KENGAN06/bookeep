import { Link } from 'react-router-dom';
import { Bookmark, Clock3, Heart, LibraryBig, Target } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { BookGrid } from '@/components/books/BookGrid';
import { ButtonLink } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { EmptyState } from '@/components/common/EmptyState';
import { Reveal } from '@/components/common/Reveal';
import { PageHero } from '@/components/scene/PageHero';
import { Scene } from '@/components/scene/Scene';
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
      <section className="relative isolate">
        <DocumentTitle title={t('library.title')} noindex />
        <Scene name="library" underHeader shade="center" />
        <Container className="relative py-16 sm:py-24">
          <Reveal direction="scale">
            <EmptyState
              className="mx-auto max-w-2xl"
              icon={<LibraryBig className="h-6 w-6" />}
              title={t('library.guestTitle')}
              description={t('library.guestHint')}
              action={
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  <ButtonLink to="/login?next=/library">{t('auth.loginSubmit')}</ButtonLink>
                  <ButtonLink to="/register?next=/library" variant="secondary">
                    {t('auth.registerSubmit')}
                  </ButtonLink>
                </div>
              }
            />
          </Reveal>
        </Container>
      </section>
    );
  }

  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email;
  const counts = [
    { label: t('library.liked'), value: liked.length, icon: Heart },
    { label: t('library.planned'), value: planned.length, icon: Bookmark },
    { label: t('library.history'), value: history.length, icon: Clock3 },
  ];

  return (
    <>
      <DocumentTitle title={t('library.title')} noindex />
      <PageHero
        scene="library"
        eyebrow={t('library.eyebrow')}
        title={t('library.title')}
        lead={t('library.hello', { name })}
        actions={
          <ButtonLink to="/goals" variant="secondary" className="w-full sm:w-auto">
            <Target className="h-4 w-4 shrink-0 text-accent" aria-hidden />
            {t('library.toGoals')}
          </ButtonLink>
        }
        aside={
          <dl className="grid gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-1 xl:grid-cols-3">
            {counts.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="glass-card flex min-w-0 items-center gap-3 rounded-[1.25rem] px-4 py-3 sm:block sm:p-5 lg:flex lg:px-5 lg:py-3.5 xl:block xl:p-5"
                >
                  <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <dt className="min-w-0 flex-1 text-sm leading-snug font-semibold break-words text-muted sm:mt-4 sm:text-[0.8125rem] lg:mt-0 xl:mt-4">{item.label}</dt>
                  <dd className="font-display text-2xl font-medium text-ink tabular-nums sm:mt-1 sm:text-4xl lg:mt-0 lg:text-3xl xl:mt-1 xl:text-4xl">{loading ? '—' : item.value}</dd>
                </div>
              );
            })}
          </dl>
        }
      />

      <Container>
        <Shelf icon={<Clock3 className="h-4 w-4" />} title={t('library.history')} empty={t('library.historyEmpty')} books={history} loading={false} />
        <Shelf icon={<Heart className="h-4 w-4" />} title={t('library.liked')} empty={t('library.likedEmpty')} books={liked} loading={loading} />
        <Shelf icon={<Bookmark className="h-4 w-4" />} title={t('library.planned')} empty={t('library.plannedEmpty')} books={planned} loading={loading} />
      </Container>
    </>
  );
}

function Shelf({
  icon,
  title,
  empty,
  books,
  loading,
}: {
  icon: ReactNode;
  title: string;
  empty: string;
  books: Book[];
  loading: boolean;
}) {
  const { t } = useTranslation();

  return (
    <section className="mt-12 first:mt-4 sm:mt-16">
      <div className="mb-6 flex items-center gap-3 border-b border-line pb-4">
        <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-accent">
          {icon}
        </span>
        <h2 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-[1.75rem]">{title}</h2>
        {!loading ? <span className="pill ml-auto">{books.length}</span> : null}
      </div>
      {loading ? (
        <BookGrid books={[]} isLoading skeletons={3} />
      ) : books.length > 0 ? (
        <BookGrid books={books} />
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-line-strong px-5 py-8 text-center text-sm text-muted sm:py-10">
          {empty}{' '}
          <Link to="/books" className="text-link">
            {t('library.toCatalog')}
          </Link>
        </div>
      )}
    </section>
  );
}
