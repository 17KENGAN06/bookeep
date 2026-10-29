import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Minus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { PDF_PAPERS, type PdfPaper } from '@/hooks/usePdfPaper';
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
  paper: PdfPaper;
  onPaperChange: (paper: PdfPaper) => void;
};

const swatches: Record<PdfPaper, string> = {
  light: 'bg-[#ffffff]',
  sepia: 'bg-[#f0e3c8]',
  night: 'bg-[#1b1a17]',
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
  paper,
  onPaperChange,
}: ReaderToolbarProps) {
  const { t } = useTranslation();
  const pageLabel = t('reader.page', { current: currentPage, total: totalPages || '—' });

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-[var(--reader-chrome)] backdrop-blur-xl">
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {pageLabel}
        </p>
        <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-5">
          <Link to={backTo} className="icon-btn" aria-label={t('reader.back')} title={t('reader.back')}>
            <ChevronLeft className="h-[18px] w-[18px]" aria-hidden />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[15px] font-medium tracking-tight text-ink sm:text-base">{title}</p>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-muted uppercase tabular-nums md:hidden" aria-hidden>
              {pageLabel}
            </p>
          </div>

          <div className="hidden items-center gap-1.5 md:flex">
            <p className="pr-2 text-sm font-semibold tabular-nums text-muted" aria-hidden>
              {pageLabel}
            </p>
            <ToolButton label={t('reader.prev')} disabled={!canPrev} onClick={onPrev}>
              <ChevronLeft className="h-4 w-4" />
            </ToolButton>
            <ToolButton label={t('reader.next')} disabled={!canNext} onClick={onNext}>
              <ChevronRight className="h-4 w-4" />
            </ToolButton>
          </div>

          <div className="hidden xl:[@media(pointer:fine)]:flex xl:[@media(pointer:fine)]:items-center xl:[@media(pointer:fine)]:gap-1.5">
            <span className="mx-1 h-6 w-px bg-line" aria-hidden />
            <ToolButton label={t('reader.zoomOut')} onClick={onZoomOut}>
              <Minus className="h-4 w-4" />
            </ToolButton>
            <ToolButton label={t('reader.zoomIn')} onClick={onZoomIn}>
              <Plus className="h-4 w-4" />
            </ToolButton>
            <ToolButton
              label={isFullscreen ? t('reader.exitFullscreen') : t('reader.fullscreen')}
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </ToolButton>
          </div>

          <div className="seg shrink-0" role="radiogroup" aria-label={t('reader.paperMode')}>
            {PDF_PAPERS.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={paper === value}
                className="seg-item inline-flex items-center gap-2 !px-2.5 lg:!px-3.5"
                title={t(`reader.paper.${value}`)}
                onClick={() => onPaperChange(value)}
              >
                <span
                  aria-hidden
                  className={cn('h-4 w-4 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.18)]', swatches[value])}
                />
                <span className="hidden lg:inline">{t(`reader.paper.${value}`)}</span>
                <span className="sr-only lg:hidden">{t(`reader.paper.${value}`)}</span>
              </button>
            ))}
          </div>

          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <nav
        aria-label={t('reader.pages')}
        className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
      >
        <div className="glass-card flex items-center gap-1 rounded-full p-1.5">
          <ToolButton label={t('reader.prev')} disabled={!canPrev} onClick={onPrev} large>
            <ChevronLeft className="h-5 w-5" />
          </ToolButton>
          <p className="min-w-20 text-center text-sm font-semibold tabular-nums text-ink" aria-hidden>
            {currentPage}
            <span className="text-muted"> / {totalPages || '—'}</span>
          </p>
          <ToolButton label={t('reader.next')} disabled={!canNext} onClick={onNext} large>
            <ChevronRight className="h-5 w-5" />
          </ToolButton>
        </div>
      </nav>
    </>
  );
}

function ToolButton({
  label,
  onClick,
  disabled,
  large,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  large?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn('icon-btn', !large && 'icon-btn-sm sm:h-10 sm:w-10', large && 'h-12 w-12')}
    >
      {children}
    </button>
  );
}
