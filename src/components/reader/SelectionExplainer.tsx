import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Languages, RotateCcw, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TRANSLATE_TO_STORAGE_KEY } from '@/config/storage';
import { supportedLanguages } from '@/i18n';
import { explainSelection, ExplainError, type ExplainErrorCode, type ExplainResult } from '@/services/explain';
import type { BookLanguage, CefrLevel, UiLanguage } from '@/types/book';
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
  | { status: 'done'; result: ExplainResult }
  | { status: 'error'; code: ExplainErrorCode };

type Translation =
  | { status: 'loading'; lang: UiLanguage }
  | { status: 'done'; lang: UiLanguage; text: string }
  | { status: 'error'; lang: UiLanguage; code: ExplainErrorCode };

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

const WORD_CHAR = /[\p{L}\p{N}\p{M}'’-]/u;

/** Grows the selection to whole words, so half a word is never sent (or shown) on its own. */
function snapToWords(selection: Selection) {
  const range = selection.getRangeAt(0);
  let { startContainer, startOffset, endContainer, endOffset } = range;

  if (startContainer.nodeType === Node.TEXT_NODE) {
    const data = (startContainer as Text).data;
    // A selection that begins on a space or comma starts at the next word instead.
    while (startOffset < data.length && /\s/.test(data[startOffset])) startOffset += 1;
    while (startOffset > 0 && WORD_CHAR.test(data[startOffset - 1])) startOffset -= 1;
  }
  if (endContainer.nodeType === Node.TEXT_NODE) {
    const data = (endContainer as Text).data;
    while (endOffset > 0 && /\s/.test(data[endOffset - 1])) endOffset -= 1;
    while (endOffset < data.length && WORD_CHAR.test(data[endOffset])) endOffset += 1;
  }

  const changed =
    startContainer !== range.startContainer ||
    startOffset !== range.startOffset ||
    endContainer !== range.endContainer ||
    endOffset !== range.endOffset;
  if (!changed) return;
  if (startContainer === endContainer && startOffset >= endOffset) return;
  selection.setBaseAndExtent(startContainer, startOffset, endContainer, endOffset);
}

function readSelection(stage: HTMLElement | null): Omit<Picked, 'context'> | null {
  const selection = window.getSelection();
  if (!stage || !selection || selection.isCollapsed || selection.rangeCount === 0) return null;
  if (!stage.contains(selection.getRangeAt(0).commonAncestorContainer)) return null;

  snapToWords(selection);
  const range = selection.getRangeAt(0);

  const text = selection.toString().replace(/\s+/g, ' ').trim();
  if (!text || text.length > MAX_SELECTION || !/\p{L}/u.test(text)) return null;

  const box = range.getBoundingClientRect();
  if (box.width === 0 && box.height === 0) return null;
  return { text, rect: { top: box.top, bottom: box.bottom, left: box.left, right: box.right } };
}

function readTargetChoice(): UiLanguage | null {
  try {
    const value = localStorage.getItem(TRANSLATE_TO_STORAGE_KEY);
    return supportedLanguages.some((item) => item.code === value) ? (value as UiLanguage) : null;
  } catch {
    return null;
  }
}

function saveTargetChoice(value: UiLanguage) {
  try {
    localStorage.setItem(TRANSLATE_TO_STORAGE_KEY, value);
  } catch {
    // Private mode: the choice lasts until the page is closed.
  }
}

function isCoarsePointer() {
  return window.matchMedia?.('(pointer: coarse)').matches ?? false;
}

export function SelectionExplainer({ stageRef, pageText, resetKey, book }: SelectionExplainerProps) {
  const { t, i18n } = useTranslation();
  const uiLanguage = (i18n.resolvedLanguage ?? 'en') as UiLanguage;
  // The site's language unless the reader picked another one; never the book's own.
  const [chosenTarget, setChosenTarget] = useState<UiLanguage | null>(readTargetChoice);
  const preferred = chosenTarget ?? uiLanguage;
  const target: UiLanguage | null = preferred === book.language ? null : preferred;
  const targets = supportedLanguages.filter((item) => item.code !== book.language);
  // Translations already fetched, by language + selection + passage.
  const translations = useRef(new Map<string, string>());
  const [translation, setTranslation] = useState<Translation | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const translateAbortRef = useRef<AbortController | null>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [open, setOpen] = useState<Picked | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null);
  const [isSheet, setIsSheet] = useState(false);

  const targetRef = useRef(target);
  targetRef.current = target;
  const pageTextRef = useRef(pageText);
  pageTextRef.current = pageText;

  const close = useCallback(() => {
    abortRef.current?.abort();
    translateAbortRef.current?.abort();
    setOpen(null);
    setAnswer(null);
    setTranslation(null);
    setShowTranslation(false);
  }, []);

  // Close everything when the page turns or the zoom changes: the rects are stale.
  useEffect(() => {
    setPicked(null);
    close();
  }, [resetKey, close]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      translateAbortRef.current?.abort();
    },
    [],
  );

  // Show the "Explain" chip once the selection settles (handles drag on phones too).
  // While the mouse button is held the reader is still choosing, so nothing snaps yet.
  useEffect(() => {
    let timer = 0;
    let mouseDown = false;
    const settle = () => {
      window.clearTimeout(timer);
      if (mouseDown) {
        setPicked(null);
        return;
      }
      timer = window.setTimeout(() => {
        const next = readSelection(stageRef.current);
        setPicked(next ? { ...next, context: '' } : null);
      }, 220);
    };
    const onDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button === 0) mouseDown = true;
    };
    const onUp = () => {
      if (!mouseDown) return;
      mouseDown = false;
      settle();
    };
    document.addEventListener('selectionchange', settle);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointerup', onUp);
    window.addEventListener('blur', onUp);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('selectionchange', settle);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', onUp);
      window.removeEventListener('blur', onUp);
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

  const translationKey = (lang: UiLanguage, item: Picked) => JSON.stringify([lang, item.text, item.context]);

  const request = useCallback(
    (item: Picked, to: UiLanguage | null, signal: AbortSignal) =>
      explainSelection(
        {
          selection: item.text,
          context: item.context,
          language: book.language,
          target: to,
          level: book.level,
          title: book.title,
        },
        signal,
      ),
    [book.language, book.level, book.title],
  );

  // One call brings the explanation and, in the background, the translation for later.
  const ask = useCallback(
    (item: Picked, to: UiLanguage | null) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setAnswer({ status: 'loading' });
      request(item, to, controller.signal)
        .then((result) => {
          if (to && result.translation) translations.current.set(translationKey(to, item), result.translation);
          if (!controller.signal.aborted) setAnswer({ status: 'done', result });
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setAnswer({ status: 'error', code: error instanceof ExplainError ? error.code : 'failed' });
        });
    },
    [request],
  );

  const translate = useCallback(
    (item: Picked, lang: UiLanguage) => {
      translateAbortRef.current?.abort();
      const known = translations.current.get(translationKey(lang, item));
      if (known) {
        setTranslation({ status: 'done', lang, text: known });
        return;
      }
      const controller = new AbortController();
      translateAbortRef.current = controller;
      setTranslation({ status: 'loading', lang });
      request(item, lang, controller.signal)
        .then((result) => {
          if (result.translation) translations.current.set(translationKey(lang, item), result.translation);
          if (!controller.signal.aborted) setTranslation({ status: 'done', lang, text: result.translation });
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setTranslation({ status: 'error', lang, code: error instanceof ExplainError ? error.code : 'failed' });
        });
    },
    [request],
  );

  const explain = () => {
    if (!picked) return;
    const item = { ...picked, context: contextAround(pageTextRef.current, picked.text) };
    setOpen(item);
    setPicked(null);
    setTranslation(null);
    setShowTranslation(false);
    ask(item, targetRef.current);
  };

  const revealTranslation = () => {
    if (!open) return;
    setShowTranslation(true);
    if (target) translate(open, target);
  };

  const changeTarget = (code: UiLanguage) => {
    saveTargetChoice(code);
    setChosenTarget(code);
    if (open) translate(open, code);
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

  // No second chip for the words the open card already explains.
  const chip = picked && picked.text !== open?.text ? chipPosition(picked.rect) : null;

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
              <p className="explain-eyebrow">{LANGUAGE_LABEL[book.language]}</p>
              <p className="explain-phrase" lang={book.language}>
                {open.text}
              </p>
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

          <div aria-live="polite" className="mt-2">
            {answer?.status === 'loading' ? (
              <div className="space-y-2 pt-1" aria-busy="true">
                <p className="sr-only">{t('reader.explain.loading')}</p>
                <span className="explain-line w-[88%]" />
                <span className="explain-line w-[60%]" />
              </div>
            ) : null}

            {answer?.status === 'done' ? (
              <p className="explain-text" lang={book.language}>
                {answer.result.explanation || answer.result.translation}
              </p>
            ) : null}

            {answer?.status === 'error' ? (
              <div className="space-y-3 pt-1">
                <p className="text-sm text-muted">{t(`reader.explain.errors.${answer.code}`)}</p>
                {answer.code !== 'not_configured' ? (
                  <button
                    type="button"
                    className="btn btn-secondary !min-h-9 !px-3.5 text-sm"
                    onClick={() => ask(open, target)}
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                    {t('reader.explain.retry')}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {answer?.status === 'done' && !showTranslation ? (
            <button type="button" className="explain-reveal mt-3" onClick={revealTranslation}>
              <Languages className="h-3.5 w-3.5" aria-hidden />
              {t('reader.explain.showTranslation')}
            </button>
          ) : null}

          {answer?.status === 'done' && showTranslation ? (
            <div className="mt-3">
              <div className="hairline mb-3" aria-hidden />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="explain-eyebrow">{t('reader.explain.translation')}</p>
                <div className="explain-langs" role="radiogroup" aria-label={t('reader.explain.translateTo')}>
                  {targets.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      role="radio"
                      aria-checked={translation?.lang === item.code}
                      className={cn('explain-lang', translation?.lang === item.code && 'is-active')}
                      onClick={() => changeTarget(item.code)}
                    >
                      {item.short}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-2" aria-live="polite">
                {!translation ? <p className="text-sm text-faint">{t('reader.explain.sameLanguage')}</p> : null}
                {translation?.status === 'loading' ? <span className="explain-line mt-1 h-4 w-[55%]" /> : null}
                {translation?.status === 'done' ? (
                  translation.text ? (
                    <p className="explain-translation" lang={translation.lang}>
                      {translation.text}
                    </p>
                  ) : (
                    <p className="text-sm text-faint">{t('reader.explain.noTranslation')}</p>
                  )
                ) : null}
                {translation?.status === 'error' ? (
                  <p className="text-sm text-muted">{t(`reader.explain.errors.${translation.code}`)}</p>
                ) : null}
              </div>
            </div>
          ) : null}

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
