import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  action?: ReactNode;
};

export function ErrorState({ title, description, onRetry, action }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <EmptyState
      role="alert"
      title={title ?? t('books.error')}
      description={description ?? t('books.errorHint')}
      action={
        action ??
        (onRetry ? (
          <Button type="button" variant="secondary" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        ) : null)
      }
    />
  );
}
