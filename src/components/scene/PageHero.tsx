import type { ReactNode } from 'react';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { Scene, type SceneName } from '@/components/scene/Scene';
import { cn } from '@/utils/cn';

type PageHeroProps = {
  scene: SceneName;
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  /** Buttons or controls under the lead. */
  actions?: ReactNode;
  /** Right-hand column on wide screens (stats, a card). */
  aside?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
  children?: ReactNode;
};

/** Opening band of an inner page: atmospheric scene, editorial heading and optional side content. */
export function PageHero({ scene, eyebrow, title, lead, actions, aside, align = 'left', className, children }: PageHeroProps) {
  const centered = align === 'center';
  return (
    <section className={cn('relative isolate', className)}>
      <Scene name={scene} underHeader shade={centered ? 'center' : 'left'} />
      <Container className="relative pt-12 pb-12 sm:pt-20 sm:pb-16 lg:pt-24 lg:pb-20">
        <div
          className={cn(
            'grid gap-10',
            Boolean(aside) && 'lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end lg:gap-16',
            centered && 'justify-items-center text-center',
          )}
        >
          <div className={cn('max-w-3xl', centered && 'mx-auto')}>
            {eyebrow ? (
              <Reveal>
                <p className="eyebrow">{eyebrow}</p>
              </Reveal>
            ) : null}
            <Reveal delay={80}>
              <h1 className="display-title mt-5 break-words">{title}</h1>
            </Reveal>
            {lead ? (
              <Reveal delay={160}>
                <p className={cn('lead mt-5 max-w-2xl', centered && 'mx-auto')}>{lead}</p>
              </Reveal>
            ) : null}
            {actions ? (
              <Reveal delay={220}>
                <div className={cn('mt-8', centered && 'flex justify-center')}>{actions}</div>
              </Reveal>
            ) : null}
          </div>
          {aside ? (
            <Reveal delay={200} direction="right" className="min-w-0">
              {aside}
            </Reveal>
          ) : null}
        </div>
        {children}
      </Container>
    </section>
  );
}
