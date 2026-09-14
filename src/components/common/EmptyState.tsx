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
        'rounded-2xl border border-dashed border-line bg-surface/70 px-5 py-12 text-center',
        className,
      )}
    >
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
