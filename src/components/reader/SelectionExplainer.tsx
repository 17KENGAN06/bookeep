import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Languages, Lock, RotateCcw, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TRANSLATE_TO_STORAGE_KEY } from '@/config/storage';
import { supportedLanguages } from '@/i18n';
import { explainSelection, ExplainError, type ExplainErrorCode, type ExplainResult } from '@/services/explain';
import type { BookLanguage, CefrLevel, UiLanguage } from '@/types/book';
import { contextAround } from '@/utils/selectionContext';
import { markOwnSelection, wordAt, type WordAt } from '@/hooks/useTextLayerSelection';
import { cn } from '@/utils/cn';

const MAX_SELECTION = 400;
const CARD_WIDTH = 360;
const GAP = 10;
const TOUCH_SETTLE_MS = 650;
/** A finger that moved less than this and lifted within TAP_MS tapped, not swiped. */
const TAP_SLOP = 10;
const TAP_MS = 350;
/** How far from a word a tap may land and still pick it. */
const TAP_REACH = 8;

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
  /** Translation is part of the subscription; without it the card offers the plan instead. */
  canTranslate?: boolean;
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

export function SelectionExplainer({ stageRef, pageText, resetKey, book, canTranslate = true }: SelectionExplainerProps) {
  const { t, i18n } = useTranslation();
  const uiLanguage = (i18n.resolvedLanguage ?? 'en') as UiLanguage;
  // The site's language unless the reader picked another one; never the book's own.
  const [chosenTarget, setChosenTarget] = useState<UiLanguage | null>(readTargetChoice);
  const preferred = chosenTarget ?? uiLanguage;
  const target: UiLanguage | null = !canTranslate || preferred === book.language ? null : preferred;
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
  const openRef = useRef(open);
  openRef.current = open;
  const openItemRef = useRef<(item: Picked) => void>(() => {});
  // The word a tap picked, while its card is open: a tap on a second word makes a phrase.
  const tapAnchorRef = useRef<(WordAt & { layer: HTMLElement }) | null>(null);

  const close = useCallback(() => {
    tapAnchorRef.current = null;
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
  // On touch screens (iPad, phones) the card opens by itself: the system menu with its
  // own translate buttons sits right over the selection, and our chip got lost beside it.
  useEffect(() => {
    let timer = 0;
    let mouseDown = false;
    let lastPointer = '';
    const settle = () => {
      window.clearTimeout(timer);
      if (mouseDown) {
        setPicked(null);
        return;
      }
      const byTouch = lastPointer === 'touch' || lastPointer === 'pen';
      timer = window.setTimeout(
        () => {
          const next = readSelection(stageRef.current);
          if (next && byTouch) {
            if (next.text !== openRef.current?.text) openItemRef.current({ ...next, context: '' });
            return;
          }
          setPicked(next ? { ...next, context: '' } : null);
        },
        // Waits a little longer on touch, while the reader may still drag the handles.
        byTouch ? TOUCH_SETTLE_MS : 220,
      );
    };
    const onDown = (event: PointerEvent) => {
      lastPointer = event.pointerType;
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

  const openItem = (base: Picked) => {
    const item = { ...base, context: contextAround(pageTextRef.current, base.text) };
    setOpen(item);
    setPicked(null);
    setTranslation(null);
    setShowTranslation(false);
    ask(item, targetRef.current);
  };
  openItemRef.current = openItem;

  const explain = () => {
    if (picked) openItem(picked);
  };

  const tapWord = (word: WordAt, layer: HTMLElement) => {
    const anchor = tapAnchorRef.current;
    const sameWord = anchor != null && anchor.node === word.node && anchor.start === word.start;
    if (anchor && open && sameWord) {
      // The same word again: put it away.
      window.getSelection()?.removeAllRanges();
      close();
      return;
    }
    let from: WordAt = word;
    let to: WordAt = word;
    if (anchor && open && anchor.layer === layer) {
      const anchorFirst =
        anchor.node === word.node
          ? anchor.start < word.start
          : Boolean(anchor.node.compareDocumentPosition(word.node) & Node.DOCUMENT_POSITION_FOLLOWING);
      if (anchorFirst) from = anchor;
      else to = anchor;
    }
    const range = document.createRange();
    range.setStart(from.node, from.start);
    range.setEnd(to.node, to.end);
    const text = range.toString().replace(/\s+/g, ' ').trim();
    if (!text || text.length > MAX_SELECTION) return;
    // A phrase ends the pick; the next tap starts a new word.
    tapAnchorRef.current = from === to ? { ...word, layer } : null;
    markOwnSelection();
    window.getSelection()?.setBaseAndExtent(from.node, from.start, to.node, to.end);
    const box = range.getBoundingClientRect();
    openItem({ text, context: '', rect: { top: box.top, bottom: box.bottom, left: box.left, right: box.right } });
  };
  const tapWordRef = useRef(tapWord);
  tapWordRef.current = tapWord;

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
      // A finger on the book's text may be tapping the next word of a phrase: the tap
      // handler below decides once the finger lifts.
      if (event.pointerType !== 'mouse' && onBookText(event.target, stageRef.current)) return;
      close();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [open, close, stageRef]);

  // Touch screens: a tap on a word picks it and opens the card; with the card open, a tap
  // on another word stretches the pick into the phrase between them. Phones decide on
  // their own what a long press selects (an iPhone often took the whole page), while a
  // tap lands where the finger is.
  useEffect(() => {
    let down: { x: number; y: number; time: number } | null = null;
    const onDown = (event: PointerEvent) => {
      down = event.pointerType === 'mouse' ? null : { x: event.clientX, y: event.clientY, time: event.timeStamp };
    };
    const onUp = (event: PointerEvent) => {
      const start = down;
      down = null;
      if (!start || event.pointerType === 'mouse') return;
      const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
      if (moved > TAP_SLOP || event.timeStamp - start.time > TAP_MS) return;
      if (!onBookText(event.target, stageRef.current)) return;
      const layer = (event.target as Element).closest<HTMLElement>('.textLayer');
      const word = layer ? wordAt(layer, event.clientX, event.clientY, TAP_REACH) : null;
      if (!layer || !word) {
        // Empty paper: the same as a tap anywhere else outside the card.
        if (openRef.current) close();
        return;
      }
      // After the browser has finished with the tap, which may clear a selection.
      window.setTimeout(() => tapWordRef.current(word, layer), 40);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', onUp);
    };
  }, [stageRef, close]);

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
      {debugOn ? <SelectionDebug stageRef={stageRef} /> : null}
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
                {answer.code === 'daily_limit' && !canTranslate ? (
                  <Link to="/subscribe" className="btn btn-secondary !min-h-9 !px-3.5 text-sm" onClick={close}>
                    {t('subscribe.cta')}
                  </Link>
                ) : null}
                {answer.code !== 'not_configured' && answer.code !== 'daily_limit' ? (
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

          {answer?.status === 'done' && (!canTranslate || answer.result.translationLocked) ? (
            <Link to="/subscribe" className="explain-reveal mt-3" onClick={close}>
              <Lock className="h-3.5 w-3.5" aria-hidden />
              {t('reader.explain.translationLocked')}
            </Link>
          ) : null}

          {answer?.status === 'done' && canTranslate && !answer.result.translationLocked && !showTranslation ? (
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

const debugOn = typeof location !== 'undefined' && location.search.includes('seldebug');

function describeNode(node: EventTarget | Node | null) {
  if (!(node instanceof Node)) return 'none';
  const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
  if (!el) return 'none';
  const cls = typeof el.className === 'string' && el.className ? '.' + el.className.split(' ').slice(0, 2).join('.') : '';
  const text = el.matches('span[role="presentation"]') ? ` "${(el.textContent ?? '').slice(0, 16)}"` : '';
  return el.tagName.toLowerCase() + cls + text;
}

/**
 * Open the reader with ?seldebug to see, on the device itself, what a finger lands on and
 * whether the page has its text layer. Not shown otherwise.
 */
function SelectionDebug({ stageRef }: { stageRef: RefObject<HTMLElement | null> }) {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    const log: Record<string, string> = {};
    const errors: string[] = [];
    const render = () => {
      const stage = stageRef.current;
      const layers = stage?.querySelectorAll('.textLayer').length ?? 0;
      const spans = stage?.querySelectorAll('.textLayer span[role="presentation"]').length ?? 0;
      const sel = window.getSelection();
      const text = sel && !sel.isCollapsed ? sel.toString().replace(/\s+/g, ' ').trim() : '';
      setLines([
        `layers ${layers} · words ${spans}`,
        `down: ${log.down ?? '—'}`,
        `up: ${log.up ?? '—'}`,
        `tap: ${log.tap ?? '—'}`,
        `selection: ${text ? `"${text.slice(0, 40)}" (${text.length})` : 'none'}${sel && sel.rangeCount ? ' from ' + describeNode(sel.getRangeAt(0).startContainer) : ''}`,
        ...errors.slice(-3).map((e) => `error: ${e}`),
        navigator.userAgent.slice(0, 90),
      ]);
    };
    const onDown = (e: PointerEvent) => {
      log.down = `${e.pointerType} ${Math.round(e.clientX)},${Math.round(e.clientY)} on ${describeNode(e.target)} · under: ${describeNode(document.elementFromPoint(e.clientX, e.clientY))}`;
      render();
    };
    const onUp = (e: PointerEvent) => {
      log.up = `${e.pointerType} on ${describeNode(e.target)}`;
      const layer = e.target instanceof Element ? e.target.closest<HTMLElement>('.textLayer') : null;
      const word = layer ? wordAt(layer, e.clientX, e.clientY, TAP_REACH) : null;
      log.tap = !layer ? 'not on the text layer' : word ? `word "${word.node.data.slice(word.start, word.end)}"` : 'no word within reach';
      render();
    };
    const onCancel = (e: PointerEvent) => {
      log.up = `CANCEL ${e.pointerType}`;
      render();
    };
    const onError = (e: ErrorEvent) => {
      errors.push(e.message);
      render();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      errors.push(String(e.reason?.message ?? e.reason));
      render();
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('pointerup', onUp, true);
    document.addEventListener('pointercancel', onCancel, true);
    document.addEventListener('selectionchange', render);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    const timer = window.setInterval(render, 1500);
    render();
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('pointerup', onUp, true);
      document.removeEventListener('pointercancel', onCancel, true);
      document.removeEventListener('selectionchange', render);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      window.clearInterval(timer);
    };
  }, [stageRef]);
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 64px)',
        left: 8,
        right: 8,
        zIndex: 60,
        padding: '6px 8px',
        font: '11px/1.35 ui-monospace, Menlo, monospace',
        color: '#fff',
        background: 'rgba(0, 0, 0, 0.78)',
        borderRadius: 8,
        pointerEvents: 'none',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {lines.join('\n')}
    </div>
  );
}

/** Whether an event target is the book's text layer on the reader stage. */
function onBookText(target: EventTarget | null, stage: HTMLElement | null) {
  return target instanceof Element && stage != null && stage.contains(target) && target.closest('.textLayer') != null;
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
