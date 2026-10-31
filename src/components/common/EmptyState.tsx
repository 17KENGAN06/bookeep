import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
  role?: 'status' | 'alert';
};

export function EmptyState({ title, description, action, icon, className, role = 'status' }: EmptyStateProps) {
  return (
    <div role={role} className={cn('lux-panel rounded-[1.75rem] px-6 py-14 text-center sm:py-16', className)}>
      {icon ? (
        <span
          aria-hidden
          className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-accent shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--app-accent)_30%,transparent),0_0_40px_var(--app-glow)]"
        >
          {icon}
        </span>
      ) : (
        <span aria-hidden className="mx-auto mb-6 block h-px w-12 bg-accent/70" />
      )}
      <h2 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-[1.75rem]">{title}</h2>
      {description ? <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-[0.9375rem]">{description}</p> : null}
      {action ? <div className="mt-8 flex justify-center">{action}</div> : null}
    </div>
  );
}
