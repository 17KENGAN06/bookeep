import { BookOpen, Languages, Layers2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';

const items = [
  { key: 'adaptation', icon: BookOpen },
  { key: 'languages', icon: Languages },
  { key: 'levels', icon: Layers2 },
] as const;

/** Editorial feature list: a statement on the left, three numbered notes on the right. */
export function Benefits() {
  const { t } = useTranslation();

  return (
    <section className="relative py-16 sm:py-24">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <Reveal>
            <div className="lg:sticky lg:top-32">
              <p className="eyebrow">{t('home.features.eyebrow')}</p>
              <h2 className="section-title mt-5 max-w-lg">{t('home.features.title')}</h2>
              <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-muted sm:text-base">{t('home.features.lead')}</p>
            </div>
          </Reveal>

          <ol className="relative grid gap-4 sm:gap-5">
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal as="li" key={item.key} delay={index * 90}>
                  <article className="lux-card lift group grid grid-cols-[auto_minmax(0,1fr)] gap-5 rounded-[1.5rem] p-6 sm:gap-7 sm:p-8">
                    <div className="flex flex-col items-center gap-4">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--app-accent)_28%,transparent)] transition duration-500 group-hover:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--app-accent)_50%,transparent),0_0_30px_var(--app-glow)]">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span aria-hidden className="font-display text-sm text-faint tabular-nums">0{index + 1}</span>
                    </div>
                    <div className="min-w-0 pt-1.5">
                      <h3 className="font-display text-[1.375rem] font-medium tracking-tight text-ink sm:text-2xl">
                        {t(`home.moods.${item.key}.title`)}
                      </h3>
                      <p className="mt-2.5 max-w-md text-[0.9375rem] leading-relaxed text-muted">{t(`home.moods.${item.key}.text`)}</p>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </Container>
    </section>
  );
}
