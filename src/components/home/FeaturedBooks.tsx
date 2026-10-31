import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BookGrid } from '@/components/books/BookGrid';
import { ButtonLink } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { ErrorState } from '@/components/common/ErrorState';
import { Reveal } from '@/components/common/Reveal';
import { Scene } from '@/components/scene/Scene';
import { useBooks } from '@/hooks/useBooks';

export function FeaturedBooks() {
  const { t } = useTranslation();
  const { books, status, reload } = useBooks();
  const featured = books.slice(0, 6);

  return (
    <section className="relative isolate py-14 sm:py-20">
      <Scene name="botanical" shade="soft" className="opacity-80" />
      <div aria-hidden className="hairline absolute inset-x-0 top-0" />
      <Container className="relative">
        <div className="mb-9 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <Reveal>
            <div>
              <p className="eyebrow">{t('nav.books')}</p>
              <h2 className="section-title mt-5">{t('home.featuredTitle')}</h2>
              <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-muted sm:text-base">{t('home.featuredSubtitle')}</p>
            </div>
          </Reveal>
          <Reveal delay={80} className="shrink-0">
            <ButtonLink to="/books" variant="outline">
              {t('home.viewAll')}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
          </Reveal>
        </div>

        {status === 'error' ? (
          <ErrorState onRetry={() => void reload()} />
        ) : (
          <BookGrid books={featured} isLoading={status === 'loading'} skeletons={3} />
        )}
      </Container>
    </section>
  );
}
