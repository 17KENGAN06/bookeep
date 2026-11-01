import { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ButtonArrow, ButtonLink } from '@/components/common/Button';
import { cn } from '@/utils/cn';

type DemoNoticeProps = {
  demoPages: number;
  /** Pages in the full book, when known. */
  fullPages: number | null;
  isGuest: boolean;
  /** The reader is on the last demo page: the notice becomes the end-of-demo card. */
  atEnd: boolean;
};

/** Thin strip under the toolbar in demo mode, and the card that ends the demo. */
export function DemoNotice({ demoPages, fullPages, isGuest, atEnd }: DemoNoticeProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const summary = fullPages
    ? t('demo.stripOf', { pages: demoPages, total: fullPages })
    : t('demo.strip', { pages: demoPages });

  return (
    <>
      <div className="demo-strip">
        <Lock className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
        <p className="min-w-0 truncate">{summary}</p>
        <Link to="/subscribe" className="demo-strip-link">
          {t('subscribe.ctaShort')}
        </Link>
      </div>

      {atEnd && !dismissed ? (
        <aside className={cn('demo-end glass-card')} aria-label={t('demo.endTitle')}>
          <button
            type="button"
            className="icon-btn icon-btn-sm absolute top-3 right-3"
            onClick={() => setDismissed(true)}
            aria-label={t('reader.explain.close')}
            title={t('reader.explain.close')}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          <p className="pr-10 font-display text-lg font-medium text-ink sm:text-xl">{t('demo.endTitle')}</p>
          <p className="mt-1.5 text-sm text-muted">{t('demo.endBody')}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ButtonLink to="/subscribe" className="!min-h-11">
              {t('subscribe.cta')}
              <ButtonArrow />
            </ButtonLink>
            {isGuest ? (
              <Link to="/login?next=/subscribe" className="text-sm font-semibold text-muted hover:text-ink">
                {t('demo.haveAccount')}
              </Link>
            ) : null}
          </div>
        </aside>
      ) : null}
    </>
  );
}
