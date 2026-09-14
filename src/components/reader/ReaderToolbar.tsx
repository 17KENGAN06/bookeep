import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Contrast, Maximize2, Minimize2, Minus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { cn } from '@/utils/cn';

type ReaderToolbarProps = {
  title: string;
  backTo: string;
  currentPage: number;
  totalPages: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isDarkPaper: boolean;
  onTogglePaper: () => void;
};

export function ReaderToolbar({
  title,
  backTo,
  currentPage,
  totalPages,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onZoomOut,
  onZoomIn,
  isFullscreen,
  onToggleFullscreen,
  isDarkPaper,
  onTogglePaper,
}: ReaderToolbarProps) {
  const { t } = useTranslation();
  const pageLabel = t('reader.page', { current: currentPage, total: totalPages || '—' });

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-md">
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {pageLabel}
      </p>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-3 py-2 sm:px-5 md:flex-row md:items-center md:gap-3">
        <div className="flex min-w-0 items-center gap-1">
          <Link
            to={backTo}
            className="focus-ring inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-ink hover:text-accent"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{t('reader.back')}</span>
          </Link>
          <p className="min-w-0 flex-1 truncate text-center font-display text-sm font-semibold sm:text-left">
            {title}
          </p>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 md:ml-auto">
          <p className="hidden shrink-0 pr-2 text-sm tabular-nums text-muted md:block" aria-hidden>
            {pageLabel}
          </p>
          <IconButton label={t('reader.prev')} disabled={!canPrev} onClick={onPrev}>
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <p className="min-w-14 text-center text-sm tabular-nums text-muted md:hidden" aria-hidden>
            {currentPage}/{totalPages || '—'}
          </p>
          <IconButton label={t('reader.next')} disabled={!canNext} onClick={onNext}>
            <ChevronRight className="h-4 w-4" />
          </IconButton>
          <IconButton label={t('reader.zoomOut')} onClick={onZoomOut}>
            <Minus className="h-4 w-4" />
          </IconButton>
          <IconButton label={t('reader.zoomIn')} onClick={onZoomIn}>
            <Plus className="h-4 w-4" />
          </IconButton>
          <IconButton
            label={isDarkPaper ? t('reader.paperLight') : t('reader.paperDark')}
            pressed={isDarkPaper}
            onClick={onTogglePaper}
          >
            <Contrast className="h-4 w-4" />
          </IconButton>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <IconButton
            label={isFullscreen ? t('reader.exitFullscreen') : t('reader.fullscreen')}
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </IconButton>
        </div>
      </div>
    </header>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  pressed,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cn(
        'focus-ring inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-ink transition hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40',
        pressed && 'border-accent/50 text-accent',
        className,
      )}
    >
      {children}
    </button>
  );
}
