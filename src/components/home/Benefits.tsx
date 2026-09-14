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
    <section className="relative pb-8 sm:pb-12">
      <Container>
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.key} delay={index * 90} direction="scale">
                <article className="glass-card h-full rounded-2xl p-5 sm:p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-elevated text-accent">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h2 className="font-display mt-4 text-lg font-semibold text-ink">
                    {t(`home.moods.${item.key}.title`)}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
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
