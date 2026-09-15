import { useLocation, useNavigate } from 'react-router-dom';
import { Bookmark, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { useLibrary } from '@/hooks/useLibrary';
import { useToast } from '@/components/common/Toast';
import { setAuthNext } from '@/utils/auth';
import { cn } from '@/utils/cn';

type LibraryActionsProps = {
  bookId: string;
  compact?: boolean;
};

export function LibraryActions({ bookId, compact = false }: LibraryActionsProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isFavorite, isPlanned, toggleFavorite, togglePlanned } = useLibrary();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const liked = isFavorite(bookId);
  const planned = isPlanned(bookId);

  function requireUser() {
    if (user) return true;
    const next = `${location.pathname}${location.search}`;
    setAuthNext(next);
    navigate(`/login?next=${encodeURIComponent(next)}`);
    return false;
  }

  async function onFavorite() {
    if (!requireUser()) return;
    const ok = await toggleFavorite(bookId);
    if (!ok) notify(t('library.error'), 'error');
  }

  async function onPlanned() {
    if (!requireUser()) return;
    const ok = await togglePlanned(bookId);
    if (!ok) notify(t('library.error'), 'error');
  }

  if (compact) {
    return (
      <div className="flex gap-1">
        <button
          type="button"
          className={cn(
            'focus-ring inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface/95 text-ink shadow-sm',
            liked && 'border-accent/50 text-accent',
          )}
          aria-pressed={liked}
          aria-label={liked ? t('library.unlike') : t('library.like')}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void onFavorite();
          }}
        >
          <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
        </button>
        <button
          type="button"
          className={cn(
            'focus-ring inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface/95 text-ink shadow-sm',
            planned && 'border-accent/50 text-accent',
          )}
          aria-pressed={planned}
          aria-label={planned ? t('library.unplan') : t('library.plan')}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void onPlanned();
          }}
        >
          <Bookmark className={cn('h-4 w-4', planned && 'fill-current')} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
      <Button type="button" variant="secondary" className="w-full min-w-48 sm:w-auto" onClick={() => void onFavorite()}>
        <Heart className={cn('h-4 w-4', liked && 'fill-current text-accent')} />
        {liked ? t('library.unlike') : t('library.like')}
      </Button>
      <Button type="button" variant="secondary" className="w-full min-w-48 sm:w-auto" onClick={() => void onPlanned()}>
        <Bookmark className={cn('h-4 w-4', planned && 'fill-current text-accent')} />
        {planned ? t('library.unplan') : t('library.plan')}
      </Button>
    </div>
  );
}
