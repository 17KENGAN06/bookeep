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
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-20">
          <Reveal direction="left" className="hidden lg:block">
            <p className="eyebrow">{t('common.appName')}</p>
            <p className="mt-6 max-w-lg font-display text-[2.75rem] leading-[1.1] text-ink italic">{t('footer.tagline')}</p>
            <ul className="mt-10 max-w-md space-y-5">
              {notes.map((note) => {
                const Icon = note.icon;
                return (
                  <li key={note.key} className="flex gap-4">
                    <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span>
                      <span className="block font-display text-lg text-ink">{t(`home.moods.${note.key}.title`)}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-muted">{t(`home.moods.${note.key}.text`)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Reveal>

          <Reveal direction="scale" className="mx-auto w-full max-w-[30rem]">
            <div className="lux-panel rounded-[2rem] px-5 py-8 sm:px-9 sm:py-10">
              <span aria-hidden className="mb-6 block h-px w-12 bg-accent/70" />
              <h1 className="font-display text-[2.1rem] leading-tight font-medium tracking-tight text-ink sm:text-[2.5rem]">{title}</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">{lead}</p>
              {children}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
