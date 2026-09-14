import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '@/components/brand/BrandMark';
import { cn } from '@/utils/cn';
import { scrollToPageTop } from '@/utils/scroll';

type BrandLockupProps = {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeMap = {
  sm: { mark: 'h-7 w-7', text: 'text-base' },
  md: { mark: 'h-8 w-8', text: 'text-lg' },
  lg: { mark: 'h-9 w-9 sm:h-10 sm:w-10', text: 'text-lg sm:text-xl' },
} as const;

export function BrandLockup({ to = '/', size = 'md', className }: BrandLockupProps) {
  const { t } = useTranslation();
  const sizes = sizeMap[size];

  const content = (
    <>
      <BrandMark className={cn(sizes.mark, 'shrink-0')} title={t('common.appName')} />
      <span className={cn('min-w-0 truncate font-display font-semibold tracking-tight text-ink', sizes.text)}>
        {t('common.appName')}
      </span>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        onClick={() => {
          if (to === '/') scrollToPageTop();
        }}
        className={cn('focus-ring inline-flex min-w-0 items-center gap-2.5 rounded-xl', className)}
      >
        {content}
      </Link>
    );
  }

  return <div className={cn('inline-flex min-w-0 items-center gap-2.5', className)}>{content}</div>;
}
