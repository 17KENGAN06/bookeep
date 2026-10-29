import { BookOpen, Languages, Layers2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';

const items = [
  { key: 'adaptation', icon: BookOpen },
  { key: 'languages', icon: Languages },
  { key: 'levels', icon: Layers2 },
] as const;

export function Benefits() {
  const { t } = useTranslation();

  return (
    <section className="relative pb-10 sm:pb-16">
      <Container>
        <div className="lux-card grid overflow-hidden rounded-[2rem] md:grid-cols-3">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal
                key={item.key}
                delay={index * 90}
                className="border-line not-first:border-t md:not-first:border-t-0 md:not-first:border-l"
              >
                <article className="h-full p-6 sm:p-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full text-gold shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--app-gold)_40%,transparent)]">
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  </div>
                  <h2 className="mt-5 font-display text-xl font-medium tracking-tight text-ink sm:text-[1.375rem]">
                    {t(`home.moods.${item.key}.title`)}
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
                    {t(`home.moods.${item.key}.text`)}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
