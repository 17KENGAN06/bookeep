import { CheckCircle2, PenLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

type AdaptationBadgeProps = {
  complete: boolean;
  variant?: 'badge' | 'banner';
  className?: string;
};

export function AdaptationBadge({ complete, variant = 'badge', className }: AdaptationBadgeProps) {
  const { t } = useTranslation();
  const Icon = complete ? CheckCircle2 : PenLine;
  const title = complete ? t('book.adaptationComplete') : t('book.adaptationInProgress');
  const hint = complete ? t('book.adaptationCompleteHint') : t('book.adaptationInProgressHint');

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex items-start gap-3 rounded-2xl border px-4 py-3.5 sm:px-5 sm:py-4',
          complete ? 'border-accent/40 bg-accent/12' : 'border-line bg-elevated',
          className,
        )}
      >
        <Icon
          className={cn('mt-0.5 h-5 w-5 shrink-0', complete ? 'text-accent' : 'text-ink')}
          aria-hidden
        />
        <div>
          <p className={cn('font-display text-sm font-semibold sm:text-base', complete ? 'text-accent' : 'text-ink')}>
            {title}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{hint}</p>
        </div>
      </div>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold',
        complete ? 'bg-accent text-on-accent' : 'bg-ink text-bg',
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {title}
    </span>
  );
}
