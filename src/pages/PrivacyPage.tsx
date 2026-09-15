import { Trans, useTranslation } from 'react-i18next';
import { Container } from '@/components/common/Container';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { Reveal } from '@/components/common/Reveal';
import { ADMIN_EMAIL } from '@/config/contact';

const SECTIONS = ['who', 'data', 'form', 'local', 'sharing', 'rights'] as const;

export function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <Container className="py-12 sm:py-16">
      <DocumentTitle title={t('privacy.title')} description={t('privacy.lead')} />
      <div className="max-w-3xl">
        <Reveal>
          <p className="font-display text-xs tracking-[0.24em] text-accent uppercase">{t('privacy.eyebrow')}</p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-ink sm:text-5xl">
            {t('privacy.title')}
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-6 text-lg leading-relaxed text-muted">{t('privacy.lead')}</p>
        </Reveal>

        <div className="mt-12 space-y-10">
          {SECTIONS.map((section, index) => (
            <Reveal key={section} delay={200 + index * 60}>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                {t(`privacy.sections.${section}.title`)}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted">
                <Trans
                  i18nKey={`privacy.sections.${section}.text`}
                  values={{ email: ADMIN_EMAIL }}
                  components={{
                    mail: (
                      <a
                        className="font-semibold text-ink underline decoration-accent/50 underline-offset-4 hover:text-accent"
                        href={`mailto:${ADMIN_EMAIL}`}
                      />
                    ),
                  }}
                />
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </Container>
  );
}
