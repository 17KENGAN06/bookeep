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
    <div role={role} className={cn('lux-panel rounded-card px-6 py-14 text-center sm:py-16', className)}>
      {icon ? (
        <span
          aria-hidden
          className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-[var(--radius-control)] border border-line bg-surface-2 text-ink"
        >
          {icon}
        </span>
      ) : (
        <span aria-hidden className="mx-auto mb-6 block h-px w-12 bg-line-strong" />
      )}
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">{title}</h2>
      {description ? <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-[0.9375rem]">{description}</p> : null}
      {action ? <div className="mt-8 flex justify-center">{action}</div> : null}
    </div>
  );
}
