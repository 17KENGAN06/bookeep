import { BookOpen, FileText, Globe, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ButtonArrow, ButtonLink } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { HeroVisual } from '@/components/home/HeroVisual';
import { Scene } from '@/components/scene/Scene';
import { useAuth } from '@/hooks/useAuth';
import { useBooks } from '@/hooks/useBooks';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { authPathFor } from '@/utils/auth';
import { getLocalizedTitle } from '@/utils/bookCopy';

function LevelsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
      <path d="M4 20v-5M9 20V9M14 20V4M19 20v-8" />
    </svg>
  );
}

export function Hero() {
  const { t, i18n } = useTranslation();
  const { user, isLoading } = useAuth();
  const goalsTo = user ? '/goals' : '/login?next=/goals';
  const isGuest = !isLoading && !user;
  const { latest } = useReadingProgress();
  const { books } = useBooks();
  // Signed-in readers pick up where they stopped; new visitors are invited to start for free.
  const lastBook = latest ? books.find((book) => book.id === latest[0]) : undefined;
  const lastProgress = latest?.[1];
  const resume = user && lastBook && lastProgress && !lastProgress.completedAt ? { book: lastBook, progress: lastProgress } : null;

  const stats = [
    { value: 'A2–B1', label: t('home.stats.levels'), icon: LevelsIcon },
    { value: 'EN · FI', label: t('home.stats.languages'), icon: Globe },
    { value: 'PDF', label: t('home.stats.reader'), icon: FileText },
  ];

  return (
    <section className="home-hero relative isolate overflow-x-clip">
      <Scene name="room" underHeader />
      <Container className="relative pt-10 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-x-6 gap-y-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:grid-rows-[auto_auto] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-x-10 tabp:grid-cols-[minmax(0,1fr)] tabp:grid-rows-none tabp:gap-y-12">
          <div className="relative z-10 min-w-0 md:self-end">
            <Reveal>
              <p className="eyebrow">{t('home.eyebrow')}</p>
            </Reveal>

            <h1 className="hero-title mt-6 font-display text-[2.5rem] leading-[1.04] font-semibold tracking-[-0.035em] break-words text-ink min-[400px]:text-[2.75rem] sm:text-[3.25rem] md:text-[2.75rem] lg:text-[3.5rem] xl:text-[4rem] 2xl:text-[4.25rem] tabp:text-[3.75rem]">
              <Reveal as="span" delay={80} className="block">
                {t('home.line1')}
              </Reveal>
              <Reveal as="span" delay={160} className="block">
                {t('home.line2')}{' '}
                <span className="text-muted">{t('home.line3')}</span>
              </Reveal>
            </h1>

            <Reveal delay={260}>
              <p className="lead mt-6 max-w-[34rem] tabp:max-w-[40rem]">{t('home.subtitle')}</p>
            </Reveal>

            <Reveal delay={340}>
              {isGuest ? (
                <>
                  <div className="mt-9 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap">
                    <ButtonLink to={authPathFor('/books')} className="hero-cta btn-lg w-full min-[480px]:w-auto">
                      <BookOpen className="h-[18px] w-[18px]" aria-hidden />
                      {t('home.ctaStart')}
                      <ButtonArrow />
                    </ButtonLink>
                    <ButtonLink to="/books" variant="secondary" className="btn-lg w-full min-[480px]:w-auto">
                      {t('home.ctaPrimary')}
                    </ButtonLink>
                  </div>
                  <ul className="mt-6 flex flex-col gap-2.5 text-[0.8125rem] leading-none tracking-[-0.005em] text-muted lg:flex-row lg:flex-wrap lg:items-center lg:gap-y-2 tabp:flex-row tabp:items-center">
                    {(['free', 'demo', 'trial'] as const).map((key) => (
                      <li key={key} className="border-line lg:pr-4 lg:not-first:border-l lg:not-first:pl-4 lg:last:pr-0 tabp:pr-4 tabp:not-first:border-l tabp:not-first:pl-4 tabp:last:pr-0">
                        {t(`home.trust.${key}`)}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="mt-9 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap">
                  {resume ? (
                    <ButtonLink to={`/read/${resume.book.slug}`} className="hero-cta btn-lg w-full min-[480px]:w-auto">
                      <BookOpen className="h-[18px] w-[18px]" aria-hidden />
                      <span className="min-w-0 truncate">
                        {t('home.ctaResume', { title: getLocalizedTitle(resume.book, i18n.resolvedLanguage ?? 'en') })}
                      </span>
                      <ButtonArrow />
                    </ButtonLink>
                  ) : null}
                  <ButtonLink
                    to="/books"
                    variant={resume ? 'secondary' : 'primary'}
                    className="btn-lg w-full min-[480px]:w-auto"
                  >
                    {t('home.ctaPrimary')}
                    {resume ? null : <ButtonArrow />}
                  </ButtonLink>
                  {resume ? null : (
                    <ButtonLink to={goalsTo} variant="secondary" className="btn-lg w-full min-[480px]:w-auto">
                      <Target className="h-[18px] w-[18px] text-muted" aria-hidden />
                      {t('home.ctaGoals')}
                    </ButtonLink>
                  )}
                </div>
              )}
              {resume ? (
                <p className="mt-4 text-sm text-muted">
                  {t('home.resumeHint', { page: resume.progress.currentPage, total: resume.progress.totalPages })}
                </p>
              ) : null}
            </Reveal>

          </div>

          <Reveal delay={180} direction="right" className="-mx-2 sm:mx-0 md:col-start-2 md:row-span-2 md:row-start-1 md:-mr-4 lg:-mr-8 tabp:col-start-auto tabp:row-span-1 tabp:row-start-auto tabp:mx-0">
            <HeroVisual />
          </Reveal>

          <div className="md:col-start-1 md:row-start-2 md:self-start tabp:col-start-auto tabp:row-start-auto">
            <Reveal delay={420}>
              <dl className="grid max-w-xl grid-cols-3 border-y border-line tabp:max-w-none">
                {stats.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.value} className="flex min-w-0 flex-col gap-3 border-line py-5 pl-4 first:pl-0 not-first:border-l sm:flex-row sm:items-start sm:py-6 sm:pl-6">
                      <Icon className="h-[18px] w-[18px] shrink-0 text-faint sm:mt-1" strokeWidth={1.75} />
                      <div className="min-w-0">
                        <dt className="sr-only">{item.label}</dt>
                        <dd className="font-display text-xl leading-tight font-semibold tracking-[-0.03em] text-ink sm:text-[1.625rem]">{item.value}</dd>
                        <dd className="mt-1.5 text-[0.75rem] leading-snug text-muted">{item.label}</dd>
                      </div>
                    </div>
                  );
                })}
              </dl>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
