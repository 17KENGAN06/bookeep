import type { ReactNode } from 'react';
import { BookOpen, Languages, Layers2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { Scene } from '@/components/scene/Scene';

const notes = [
  { key: 'adaptation', icon: BookOpen },
  { key: 'languages', icon: Languages },
  { key: 'levels', icon: Layers2 },
] as const;

/** Sign-in and sign-up frame: a quiet editorial column beside the form card. */
export function AuthShell({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <section className="relative isolate">
      <Scene name="botanical" underHeader shade="soft" />
      <Container className="relative py-10 sm:py-16 lg:py-20">
        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-6 tabp:grid-cols-[minmax(0,1fr)] tabp:gap-6">
          <Reveal direction="left" className="hidden lg:block tabp:order-last tabp:block">
            <div className="feature-panel flex h-full flex-col justify-between gap-12 p-10 xl:p-14 tabp:p-10">
            <div>
            <p className="eyebrow">{t('common.appName')}</p>
            <p className="mt-6 max-w-lg font-display font-semibold text-[2.75rem] tracking-[-0.035em] tabp:text-[2.25rem] leading-[1.08] text-ink">{t('footer.tagline')}</p>
            </div>
            <ul className="grid max-w-none gap-0 border-t border-line tabp:grid-cols-3">
              {notes.map((note) => {
                const Icon = note.icon;
                return (
                  <li key={note.key} className="flex gap-4 border-b border-line py-5 last:border-b-0 last:pb-0 tabp:flex-col tabp:gap-3 tabp:border-b-0 tabp:pr-6">
                    <span aria-hidden className="icon-tile">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span>
                      <span className="block font-display font-semibold text-lg text-ink">{t(`home.moods.${note.key}.title`)}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-muted">{t(`home.moods.${note.key}.text`)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            </div>
          </Reveal>

          <Reveal direction="scale" className="mx-auto w-full max-w-[30rem] lg:h-full tabp:max-w-[34rem]">
            <div className="lux-card h-full rounded-sheet px-5 py-8 sm:px-9 sm:py-10">
              <span aria-hidden className="mb-6 block h-px w-12 bg-line-strong" />
              <h1 className="font-display text-[2.1rem] leading-tight font-semibold tracking-tight text-ink sm:text-[2.5rem]">{title}</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">{lead}</p>
              {children}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
