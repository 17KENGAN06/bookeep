import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookFilters } from '@/components/books/BookFilters';
import { BookGrid } from '@/components/books/BookGrid';
import { Button } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Reveal } from '@/components/common/Reveal';
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

  return (
    <Container className="py-10 sm:py-14">
      <DocumentTitle title={t('books.title')} description={t('books.subtitle')} />
      <Reveal as="header" className="max-w-2xl">
        <p className="font-display text-xs tracking-[0.24em] text-accent uppercase">{t('nav.books')}</p>
        <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink sm:text-5xl">
          {t('books.title')}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">{t('books.subtitle')}</p>
      </Reveal>

      <Reveal delay={80} className="mt-8">
        <BookFilters
          language={language}
          level={level}
          onLanguageChange={(value) => {
            const next = new URLSearchParams(params);
            if (value === 'all') next.delete('lang');
            else next.set('lang', value);
            setParams(next, { replace: true });
          }}
          onLevelChange={(value) => {
            const next = new URLSearchParams(params);
            if (value === 'all') next.delete('level');
            else next.set('level', value);
            setParams(next, { replace: true });
          }}
        />
      </Reveal>

      <div className="mt-8">
        {status === 'error' ? (
          <ErrorState onRetry={() => void reload()} />
        ) : status === 'loading' ? (
          <BookGrid books={[]} isLoading />
        ) : filtered.length === 0 ? (
          <EmptyState
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
  );
}
