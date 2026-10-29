import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BookGrid } from '@/components/books/BookGrid';
import { Container } from '@/components/common/Container';
import { ErrorState } from '@/components/common/ErrorState';
import { Reveal } from '@/components/common/Reveal';
import { useBooks } from '@/hooks/useBooks';

export function FeaturedBooks() {
  const { t } = useTranslation();
  const { books, status, reload } = useBooks();
  const featured = books.slice(0, 8);

  return (
    <section className="relative py-12 sm:py-20">
      <Container>
        <div className="mb-8 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <Reveal>
            <div>
              <p className="eyebrow">{t('nav.books')}</p>
              <h2 className="section-title mt-4">{t('home.featuredTitle')}</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
                {t('home.featuredSubtitle')}
              </p>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <Link to="/books" className="btn btn-quiet">
              <span className="btn-label">{t('home.viewAll')}</span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Reveal>
        </div>

        {status === 'error' ? (
          <ErrorState onRetry={() => void reload()} />
        ) : (
          <BookGrid books={featured} isLoading={status === 'loading'} />
        )}
      </Container>
    </section>
  );
}
