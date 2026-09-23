import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

type AdaptationBadgeProps = {
  complete: boolean;
  className?: string;
};

export function AdaptationBadge({ complete, className }: AdaptationBadgeProps) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center rounded-lg px-2 text-xs font-semibold',
        complete ? 'bg-accent/15 text-accent' : 'bg-elevated text-muted',
        className,
      )}
    >
      {complete ? t('book.adaptationComplete') : t('book.adaptationInProgress')}
    </span>
  );
}
