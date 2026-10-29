import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  role?: 'status' | 'alert';
};

export function EmptyState({ title, description, action, className, role = 'status' }: EmptyStateProps) {
  return (
    <div
      role={role}
      className={cn(
        'lux-card rounded-[1.75rem] px-6 py-14 text-center sm:py-16',
        className,
      )}
    >
      <span aria-hidden className="mx-auto mb-5 block h-px w-10 bg-gold/70" />
      <h2 className="font-display text-xl font-medium tracking-tight text-ink sm:text-2xl">{title}</h2>
      {description ? <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-[0.9375rem]">{description}</p> : null}
      {action ? <div className="mt-7 flex justify-center">{action}</div> : null}
    </div>
  );
}
