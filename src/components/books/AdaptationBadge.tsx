import { CheckCircle2, PenLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

type AdaptationBadgeProps = {
  complete: boolean;
  variant?: 'badge' | 'banner';
  /** Icon only on narrow screens. */
  compact?: boolean;
  className?: string;
};

export function AdaptationBadge({ complete, variant = 'badge', compact = false, className }: AdaptationBadgeProps) {
  const { t } = useTranslation();
  const Icon = complete ? CheckCircle2 : PenLine;
  const title = complete ? t('book.adaptationComplete') : t('book.adaptationInProgress');
  const hint = complete ? t('book.adaptationCompleteHint') : t('book.adaptationInProgressHint');

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex items-start gap-3.5 rounded-2xl border px-4 py-4 sm:px-5',
          complete ? 'border-accent/25 bg-accent-soft' : 'border-line-strong bg-surface/60 backdrop-blur-md',
          className,
        )}
      >
        <Icon
          className={cn('mt-0.5 h-5 w-5 shrink-0', complete ? 'text-accent' : 'text-muted')}
          aria-hidden
        />
        <div>
          <p className="font-display text-[0.9375rem] font-medium text-ink sm:text-base">
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
        'inline-flex min-h-7 items-center gap-1.5 rounded-full bg-black/60 px-2.5 text-[11px] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] backdrop-blur-md',
        compact && 'min-w-7 justify-center px-0',
        className,
      )}
      title={compact ? title : undefined}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span className={cn(compact && 'sr-only')}>{title}</span>
    </span>
  );
}
