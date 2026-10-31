import { Trans, useTranslation } from 'react-i18next';
import { Container } from '@/components/common/Container';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { Reveal } from '@/components/common/Reveal';
import { PageHero } from '@/components/scene/PageHero';
import { ADMIN_EMAIL } from '@/config/contact';

const SECTIONS = ['who', 'data', 'account', 'form', 'local', 'sharing', 'rights'] as const;

export function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <>
      <DocumentTitle title={t('privacy.title')} description={t('privacy.lead')} />
      <PageHero scene="library" eyebrow={t('privacy.eyebrow')} title={t('privacy.title')} lead={t('privacy.lead')} />

      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-16">
          <nav aria-label={t('privacy.title')} className="hidden lg:block">
            <ol className="sticky top-32 space-y-1 border-l border-line">
              {SECTIONS.map((section) => (
                <li key={section}>
                  <a
                    href={`#privacy-${section}`}
                    className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-muted transition hover:border-accent hover:text-ink"
                  >
                    {t(`privacy.sections.${section}.title`)}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="max-w-3xl space-y-4">
            {SECTIONS.map((section, index) => (
              <Reveal key={section} delay={index * 50}>
                <section id={`privacy-${section}`} className="lux-card scroll-mt-28 rounded-[1.5rem] p-6 sm:p-8">
                  <h2 className="font-display text-xl font-medium tracking-tight text-ink sm:text-2xl">
                    {t(`privacy.sections.${section}.title`)}
                  </h2>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                    <Trans
                      i18nKey={`privacy.sections.${section}.text`}
                      values={{ email: ADMIN_EMAIL }}
                      components={{ mail: <a className="text-link" href={`mailto:${ADMIN_EMAIL}`} /> }}
                    />
                  </p>
                </section>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
