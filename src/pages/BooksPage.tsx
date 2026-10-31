import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BookFilters } from '@/components/books/BookFilters';
import { BookGrid } from '@/components/books/BookGrid';
import { Button } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Reveal } from '@/components/common/Reveal';
import { PageHero } from '@/components/scene/PageHero';
import { useBooks } from '@/hooks/useBooks';
import { BOOK_LANGUAGES, CEFR_LEVELS, type BookLanguage, type CefrLevel } from '@/types/book';

function parseLanguage(value: string | null): BookLanguage | 'all' {
  return BOOK_LANGUAGES.includes(value as BookLanguage) ? (value as BookLanguage) : 'all';
}

function parseLevel(value: string | null): CefrLevel | 'all' {
  return CEFR_LEVELS.includes(value as CefrLevel) ? (value as CefrLevel) : 'all';
}

export function BooksPage() {
  const { t } = useTranslation();
  const { books, status, reload } = useBooks();
  const [params, setParams] = useSearchParams();
  const language = parseLanguage(params.get('lang'));
  const level = parseLevel(params.get('level'));

  const filtered = useMemo(() => {
    return books.filter((book) => {
      const languageMatch = language === 'all' || book.language === language;
      const levelMatch = level === 'all' || book.level === level;
      return languageMatch && levelMatch;
    });
  }, [books, language, level]);

  const emptyMessage = (() => {
    if (language === 'fi') return t('books.emptyFi');
    if (language === 'en') return t('books.emptyEn');
    if (level !== 'all') return t('books.emptyLevel');
    return t('books.empty');
  })();

  const setFilter = (key: 'lang' | 'level', value: string) => {
    const next = new URLSearchParams(params);
    if (value === 'all') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  return (
    <>
      <DocumentTitle title={t('books.title')} description={t('books.subtitle')} />
      <PageHero
        scene="library"
        eyebrow={t('nav.books')}
        title={t('books.title')}
        lead={t('books.subtitle')}
        aside={
          status === 'success' ? (
            <dl className="flex gap-8 lg:justify-end">
              <HeroStat value={books.length} label={t('books.statTitles')} />
              <HeroStat value={books.filter((book) => book.language === 'en').length} label={t('languages.en')} />
              <HeroStat value={books.filter((book) => book.language === 'fi').length} label={t('languages.fi')} />
            </dl>
          ) : null
        }
      />

      <Container className="relative">
        <Reveal delay={80}>
          <div className="glass-card flex flex-col gap-5 rounded-[1.75rem] p-4 sm:p-5 md:flex-row md:items-end md:justify-between">
            <BookFilters
              language={language}
              level={level}
              onLanguageChange={(value) => setFilter('lang', value)}
              onLevelChange={(value) => setFilter('level', value)}
            />
            {status === 'success' ? (
              <p className="text-sm text-muted md:pb-2.5" aria-live="polite">
                {t('books.shown', { count: filtered.length })}
              </p>
            ) : null}
          </div>
        </Reveal>

        <div className="mt-8 sm:mt-10">
          {status === 'error' ? (
            <ErrorState onRetry={() => void reload()} />
          ) : status === 'loading' ? (
            <BookGrid books={[]} isLoading />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<SearchX className="h-6 w-6" />}
              title={emptyMessage}
              action={
                language !== 'all' || level !== 'all' ? (
                  <Button type="button" variant="secondary" onClick={() => setParams({}, { replace: true })}>
                    {t('books.showAll')}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <BookGrid books={filtered} />
          )}
        </div>
      </Container>
    </>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="font-display text-4xl font-medium tracking-tight text-ink tabular-nums sm:text-5xl">{value}</dd>
      <dd className="mt-1 text-xs font-semibold tracking-[0.16em] text-muted uppercase">{label}</dd>
    </div>
  );
}
