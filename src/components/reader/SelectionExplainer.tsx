import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { LoaderCircle, RotateCcw, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { explainSelection, ExplainError, type ExplainErrorCode } from '@/services/explain';
import type { BookLanguage, CefrLevel } from '@/types/book';
import { contextAround } from '@/utils/selectionContext';
import { cn } from '@/utils/cn';

const MAX_SELECTION = 400;
const CARD_WIDTH = 360;
const GAP = 10;

type Picked = {
  text: string;
  context: string;
  rect: { top: number; bottom: number; left: number; right: number };
};

type Answer =
  | { status: 'loading' }
  | { status: 'done'; text: string }
  | { status: 'error'; code: ExplainErrorCode };

type SelectionExplainerProps = {
  /** The reader stage; selections outside it are ignored. */
  stageRef: RefObject<HTMLElement | null>;
  /** Text of the page on screen, for the passage around the selection. */
  pageText: string;
  /** Changes when the page or zoom changes: anything open is closed. */
  resetKey: string;
  book: { language: BookLanguage; level: CefrLevel; title: string };
};

const LANGUAGE_LABEL: Record<BookLanguage, string> = {
  en: 'Simple English',
  fi: 'Selkosuomi',
};

function readSelection(stage: HTMLElement | null): Omit<Picked, 'context'> | null {
  const selection = window.getSelection();
  if (!stage || !selection || selection.isCollapsed || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!stage.contains(range.commonAncestorContainer)) return null;

  const text = selection.toString().replace(/\s+/g, ' ').trim();
  if (!text || text.length > MAX_SELECTION || !/\p{L}/u.test(text)) return null;

  const box = range.getBoundingClientRect();
  if (box.width === 0 && box.height === 0) return null;
  return { text, rect: { top: box.top, bottom: box.bottom, left: box.left, right: box.right } };
}

function isCoarsePointer() {
  return window.matchMedia?.('(pointer: coarse)').matches ?? false;
}

export function SelectionExplainer({ stageRef, pageText, resetKey, book }: SelectionExplainerProps) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<Picked | null>(null);
  const [open, setOpen] = useState<Picked | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null);
  const [isSheet, setIsSheet] = useState(false);

  const pageTextRef = useRef(pageText);
  pageTextRef.current = pageText;

  const close = useCallback(() => {
    abortRef.current?.abort();
    setOpen(null);
    setAnswer(null);
  }, []);

  // Close everything when the page turns or the zoom changes: the rects are stale.
  useEffect(() => {
    setPicked(null);
    close();
  }, [resetKey, close]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Show the "Explain" chip once the selection settles (handles drag on phones too).
  useEffect(() => {
    let timer = 0;
    const onChange = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const next = readSelection(stageRef.current);
        setPicked(next ? { ...next, context: '' } : null);
      }, 220);
    };
    document.addEventListener('selectionchange', onChange);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('selectionchange', onChange);
    };
  }, [stageRef]);

  // Scrolling moves the selection; hide the chip rather than leave it floating elsewhere.
  useEffect(() => {
    if (!picked) return;
    const hide = () => setPicked(null);
    window.addEventListener('scroll', hide, { passive: true, capture: true });
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('scroll', hide, { capture: true });
      window.removeEventListener('resize', hide);
    };
  }, [picked]);

  const ask = useCallback(
    (target: Picked) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setAnswer({ status: 'loading' });
      explainSelection(
        {
          selection: target.text,
          context: target.context,
          language: book.language,
          level: book.level,
          title: book.title,
        },
        controller.signal,
      )
        .then((text) => {
          if (!controller.signal.aborted) setAnswer({ status: 'done', text });
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setAnswer({ status: 'error', code: error instanceof ExplainError ? error.code : 'failed' });
        });
    },
    [book.language, book.level, book.title],
  );

  const explain = () => {
    if (!picked) return;
    const target = { ...picked, context: contextAround(pageTextRef.current, picked.text) };
    setOpen(target);
    setPicked(null);
    ask(target);
  };

  // Escape or a tap outside the card closes it.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onDown = (event: PointerEvent) => {
      if (cardRef.current && event.target instanceof Node && cardRef.current.contains(event.target)) return;
      close();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [open, close]);

  // Desktop: a popover beside the selection. Narrow screens: a sheet above the bottom bar.
  useLayoutEffect(() => {
    if (!open) {
      setCardPos(null);
      return;
    }
    const sheet = window.innerWidth < 640;
    setIsSheet(sheet);
    if (sheet) {
      setCardPos(null);
      return;
    }
    const card = cardRef.current;
    const height = card?.offsetHeight ?? 220;
    const width = Math.min(CARD_WIDTH, window.innerWidth - 32);
    const center = (open.rect.left + open.rect.right) / 2;
    const left = Math.min(Math.max(16, center - width / 2), window.innerWidth - width - 16);
    const below = open.rect.bottom + GAP;
    const top =
      below + height <= window.innerHeight - 16 ? below : Math.max(16, open.rect.top - GAP - height);
    setCardPos({ top, left });
  }, [open, answer]);

  const chip = picked ? chipPosition(picked.rect) : null;

  return (
    <>
      {picked && chip ? (
        <button
          type="button"
          className="explain-chip"
          style={{ top: chip.top, left: chip.left }}
          // Keeps the selection alive on desktop: a mousedown on a button would clear it.
          onPointerDown={(event) => event.preventDefault()}
          onClick={explain}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {t('reader.explain.action')}
        </button>
      ) : null}

      {open ? (
        <div
          ref={cardRef}
          role="dialog"
          aria-modal="false"
          aria-label={t('reader.explain.title')}
          className={cn('explain-card', isSheet ? 'explain-card--sheet' : 'explain-card--pop')}
          style={!isSheet && cardPos ? { top: cardPos.top, left: cardPos.left } : undefined}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="explain-eyebrow">
                {t('reader.explain.title')} · {LANGUAGE_LABEL[book.language]}
              </p>
              <p className="explain-phrase">{open.text}</p>
            </div>
            <button
              type="button"
              className="icon-btn icon-btn-sm -mt-1 -mr-1"
              onClick={close}
              aria-label={t('reader.explain.close')}
              title={t('reader.explain.close')}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="hairline my-3" aria-hidden />

          <div aria-live="polite" lang={book.language}>
            {answer?.status === 'loading' ? (
              <div className="space-y-2" aria-busy="true">
                <p className="sr-only">{t('reader.explain.loading')}</p>
                <span className="explain-line w-[92%]" />
                <span className="explain-line w-[78%]" />
                <span className="explain-line w-[56%]" />
                <p className="flex items-center gap-2 pt-1 text-xs text-faint" aria-hidden>
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  {t('reader.explain.loading')}
                </p>
              </div>
            ) : null}

            {answer?.status === 'done' ? <p className="explain-text">{answer.text}</p> : null}

            {answer?.status === 'error' ? (
              <div className="space-y-3">
                <p className="text-sm text-muted">{t(`reader.explain.errors.${answer.code}`)}</p>
                {answer.code !== 'not_configured' ? (
                  <button type="button" className="btn btn-secondary !min-h-9 !px-3.5 text-sm" onClick={() => ask(open)}>
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                    {t('reader.explain.retry')}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {answer?.status === 'done' ? (
            <p className="mt-3 text-[0.6875rem] leading-snug text-faint">{t('reader.explain.disclaimer')}</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

/** Above the selection with a mouse; below it on touch, where the system menu sits above. */
function chipPosition(rect: Picked['rect']) {
  const chipHeight = 36;
  const chipWidth = 132;
  const center = (rect.left + rect.right) / 2;
  const left = Math.min(Math.max(12, center - chipWidth / 2), window.innerWidth - chipWidth - 12);
  const preferBelow = isCoarsePointer() || rect.top - chipHeight - GAP < 72;
  const top = preferBelow
    ? Math.min(rect.bottom + GAP, window.innerHeight - chipHeight - 12)
    : rect.top - chipHeight - GAP;
  return { top, left };
}
