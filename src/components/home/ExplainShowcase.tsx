import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Languages, MonitorSmartphone, MousePointer2, ScanText, Sparkles, TextSelect, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ButtonArrow, ButtonLink } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { useAuth } from '@/hooks/useAuth';
import { supportedLanguages, type AppLanguage } from '@/i18n';
import { authPathFor } from '@/utils/auth';
import { cn } from '@/utils/cn';
import './ExplainShowcase.css';

/**
 * Home page showcase of the reader's "select text → explanation → translation" card.
 * The illustration is a live mock built from the reader's own card styles, so it stays
 * crisp, matches the theme and speaks the visitor's language. It plays itself while in
 * view; clicking a step or a language takes over.
 */

type Stage = 0 | 1 | 2;
type SampleKey = 'en' | 'fi';

type Sample = {
  label: string;
  eyebrow: string;
  chapter: string;
  lead: string;
  before: string;
  phrase: string;
  after: string;
  tail: string;
  explanation: string;
  translations: Partial<Record<AppLanguage, string>>;
};

// Book-side text stays in the book's language on every site language, like in the reader.
const SAMPLES: Record<SampleKey, Sample> = {
  en: {
    label: 'English',
    eyebrow: 'Simple English',
    chapter: 'Chapter 3',
    lead: 'The rain stopped just before dark. Anna found the letter under the door, opened it slowly and read it twice.',
    before: 'Then she sat down by the window. She was',
    phrase: 'at a loss for words',
    after: '.',
    tail: 'Outside, the old garden was quiet, and the lamps in the street came on one by one.',
    explanation: 'She was so surprised that she did not know what to say.',
    translations: {
      fi: 'sanaton',
      uk: 'не знаходила слів',
      ru: 'не находила слов',
      pl: 'zabrakło jej słów',
      de: 'ihr fehlten die Worte',
      fr: 'elle ne trouvait pas ses mots',
      it: 'non trovava le parole',
      es: 'se quedó sin palabras',
    },
  },
  fi: {
    label: 'Suomi',
    eyebrow: 'Selkosuomi',
    chapter: 'Luku 3',
    lead: 'Matti korjasi vanhaa venettä koko kesän. Joka ilta hän meni rantaan ja teki töitä pimeään asti.',
    before: 'Syyskuussa vene vuoti yhä. Lopulta Matti',
    phrase: 'heitti hanskat tiskiin',
    after: '.',
    tail: 'Hän istui laiturilla, katsoi järveä ja nauroi itselleen.',
    explanation: 'Hän lopetti yrittämisen. Työ oli liian vaikea, joten hän luovutti.',
    translations: {
      en: 'threw in the towel',
      uk: 'опустив руки',
      ru: 'опустил руки',
      pl: 'dał za wygraną',
      de: 'warf das Handtuch',
      fr: 'a jeté l’éponge',
      it: 'ha gettato la spugna',
      es: 'tiró la toalla',
    },
  },
};

const STEPS = [
  { key: 'select', icon: TextSelect },
  { key: 'explain', icon: Sparkles },
  { key: 'translate', icon: Languages },
] as const;

const PERKS = [
  { key: 'context', icon: ScanText },
  { key: 'devices', icon: MonitorSmartphone },
  { key: 'languages', icon: Languages },
] as const;

/** How long each stage stays on screen while the demo plays itself. */
const STAGE_MS: Record<Stage, number> = { 0: 2800, 1: 4200, 2: 5200 };
const LOADING_MS = 700;

function defaultTarget(book: SampleKey, site: string): AppLanguage {
  const siteLang = supportedLanguages.find((item) => item.code === site)?.code;
  if (siteLang && siteLang !== book) return siteLang;
  return book === 'en' ? 'fi' : 'en';
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
}

export function ExplainShowcase() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const siteLang = (i18n.resolvedLanguage || i18n.language || 'en').slice(0, 2);

  const [sampleKey, setSampleKey] = useState<SampleKey>('en');
  const [stage, setStage] = useState<Stage>(() => (prefersReducedMotion() ? 2 : 0));
  const [loading, setLoading] = useState(false);
  const [autoplay, setAutoplay] = useState(() => !prefersReducedMotion());
  const [inView, setInView] = useState(false);
  const [target, setTarget] = useState<AppLanguage | null>(null);

  const sample = SAMPLES[sampleKey];
  const activeTarget = target && target !== sampleKey ? target : defaultTarget(sampleKey, siteLang);
  const targets = supportedLanguages.filter((item) => item.code !== sampleKey);

  const sectionRef = useRef<HTMLElement>(null);

  // Play only while the visitor can see it.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), {
      threshold: 0.25,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Autoplay: select → explain → translate, then the other book.
  useEffect(() => {
    if (!autoplay || !inView) return;
    const timer = window.setTimeout(() => {
      if (stage < 2) {
        setStage((stage + 1) as Stage);
      } else {
        setSampleKey((key) => (key === 'en' ? 'fi' : 'en'));
        setStage(0);
      }
    }, STAGE_MS[stage]);
    return () => window.clearTimeout(timer);
  }, [autoplay, inView, stage, sampleKey]);

  // A short shimmer when the card opens, like the real request.
  useEffect(() => {
    if (stage !== 1 || prefersReducedMotion()) return;
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), LOADING_MS);
    return () => window.clearTimeout(timer);
  }, [stage, sampleKey]);

  const takeOver = useCallback(() => setAutoplay(false), []);

  const goTo = (next: Stage) => {
    takeOver();
    setStage(next);
  };

  const pickSample = (key: SampleKey) => {
    takeOver();
    setSampleKey(key);
    setStage(2);
  };

  const pickTarget = (code: AppLanguage) => {
    takeOver();
    setTarget(code);
  };

  const ctaTo = user ? '/books' : authPathFor('/books');

  return (
    <section ref={sectionRef} className="xs-section relative isolate overflow-hidden py-16 sm:py-24">
      <div aria-hidden className="hairline absolute inset-x-0 top-0" />
      <div aria-hidden className="xs-aura" />
      <Container className="relative">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:grid-rows-[auto_auto] lg:gap-x-16 lg:gap-y-0 xl:gap-x-20">
          <div className="min-w-0 lg:col-start-1 lg:row-start-1 lg:self-end">
            <Reveal>
              <p className="eyebrow">{t('home.explain.eyebrow')}</p>
              <h2 className="section-title mt-5 max-w-xl">{t('home.explain.title')}</h2>
              <p className="mt-5 max-w-lg text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {t('home.explain.lead')}
              </p>
            </Reveal>
          </div>

          <Reveal direction="scale" delay={120} className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
            <div className="xs-stage">
              <div className="xs-stage-bar">
                <div className="xs-tabs" role="group" aria-label={t('home.explain.sampleLabel')}>
                  {(Object.keys(SAMPLES) as SampleKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={sampleKey === key}
                      className={cn('xs-tab', sampleKey === key && 'is-active')}
                      onClick={() => pickSample(key)}
                    >
                      {SAMPLES[key].label}
                    </button>
                  ))}
                </div>
                <span className="xs-stage-hint">{t('home.explain.sampleLabel')}</span>
              </div>

              <DemoPage
                sample={sample}
                sampleKey={sampleKey}
                stage={stage}
                loading={loading}
                target={activeTarget}
                targets={targets}
                onReveal={() => goTo(2)}
                onExplain={() => goTo(1)}
                onClose={() => goTo(0)}
                onTarget={pickTarget}
              />

              <PhoneMock sample={sample} sampleKey={sampleKey} target={activeTarget} />
            </div>
          </Reveal>

          <div className="min-w-0 lg:col-start-1 lg:row-start-2 lg:self-start">
            <ol className="grid gap-3 lg:mt-9">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const active = stage === index;
                const done = stage > index;
                return (
                  <Reveal as="li" key={step.key} delay={80 + index * 90}>
                    <button
                      type="button"
                      onClick={() => goTo(index as Stage)}
                      aria-pressed={active}
                      className={cn('xs-step', active && 'is-active', done && 'is-done')}
                    >
                      <span className="xs-step-icon">
                        <Icon className="h-[1.05rem] w-[1.05rem]" aria-hidden />
                      </span>
                      <span className="min-w-0 text-left">
                        <span className="xs-step-title">
                          <span className="xs-step-num" aria-hidden>
                            0{index + 1}
                          </span>
                          {t(`home.explain.steps.${step.key}.title`)}
                        </span>
                        <span className="xs-step-text">{t(`home.explain.steps.${step.key}.text`)}</span>
                      </span>
                      {active && autoplay && inView ? (
                        <span
                          aria-hidden
                          key={`${sampleKey}-${stage}`}
                          className="xs-step-progress"
                          style={{ animationDuration: `${STAGE_MS[stage]}ms` }}
                        />
                      ) : null}
                    </button>
                  </Reveal>
                );
              })}
            </ol>

            <Reveal delay={360}>
              <div className="mt-9 flex flex-col gap-4 min-[480px]:flex-row min-[480px]:items-center">
                <ButtonLink to={ctaTo} className="hero-cta w-full !min-h-13 !px-7 min-[480px]:w-auto">
                  {t('home.explain.cta')}
                  <ButtonArrow />
                </ButtonLink>
                <p className="max-w-xs text-[0.8125rem] leading-snug text-faint">{t('home.explain.note')}</p>
              </div>
            </Reveal>
          </div>
        </div>

        <ul className="mt-14 grid gap-3 sm:mt-16 sm:grid-cols-3 sm:gap-4">
          {PERKS.map((perk, index) => {
            const Icon = perk.icon;
            return (
              <Reveal as="li" key={perk.key} delay={index * 90}>
                <div className="xs-perk">
                  <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <span>{t(`home.explain.perks.${perk.key}`)}</span>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

type DemoPageProps = {
  sample: Sample;
  sampleKey: SampleKey;
  stage: Stage;
  loading: boolean;
  target: AppLanguage;
  targets: ReadonlyArray<(typeof supportedLanguages)[number]>;
  onExplain: () => void;
  onReveal: () => void;
  onClose: () => void;
  onTarget: (code: AppLanguage) => void;
};

/** A reader page with the phrase, the chip and the card positioned like in the real reader. */
function DemoPage({ sample, sampleKey, stage, loading, target, targets, onExplain, onReveal, onClose, onTarget }: DemoPageProps) {
  const { t } = useTranslation();
  const pageRef = useRef<HTMLDivElement>(null);
  const phraseRef = useRef<HTMLSpanElement>(null);
  const [anchor, setAnchor] = useState<{ top: number; left: number; center: number; phraseTop: number } | null>(null);
  const [sheet, setSheet] = useState(false);

  const measure = useCallback(() => {
    const page = pageRef.current;
    const phrase = phraseRef.current;
    if (!page || !phrase) return;
    const pageBox = page.getBoundingClientRect();
    const rects = Array.from(phrase.getClientRects());
    if (!rects.length || !page.offsetWidth) return;
    // The section fades in with a scale transform: convert screen pixels back to layout pixels.
    const scale = pageBox.width / page.offsetWidth || 1;
    const x = (value: number) => (value - pageBox.left) / scale;
    const y = (value: number) => (value - pageBox.top) / scale;
    const first = rects[0];
    const last = rects[rects.length - 1];
    const width = page.offsetWidth;
    const cardWidth = Math.min(376, width - 24);
    setSheet(width < 460);
    setAnchor({
      top: y(last.bottom) + 12,
      left: Math.min(Math.max(12, x(first.left) - 18), width - cardWidth - 12),
      center: (x(first.left) + x(first.right)) / 2,
      phraseTop: y(first.top),
    });
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure, sampleKey]);

  useEffect(() => {
    const page = pageRef.current;
    if (!page || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(page);
    // Fonts arrive after first paint and move the phrase.
    document.fonts?.ready.then(measure).catch(() => undefined);
    return () => observer.disconnect();
  }, [measure]);

  const translation = sample.translations[target];

  return (
    <div ref={pageRef} className={cn('xs-page', sheet && 'is-narrow')} translate="no" data-stage={stage}>
      <p className="xs-page-chapter">{sample.chapter}</p>
      <div key={sampleKey} className="xs-page-text" lang={sampleKey}>
        <p>{sample.lead}</p>
        <p>
          {sample.before}{' '}
          <span ref={phraseRef} className={cn('xs-phrase', 'is-selected')}>
            {sample.phrase}
          </span>
          {sample.after} {sample.tail}
        </p>
        <p className="xs-page-fade" aria-hidden>
          {sample.tail} {sample.lead} {sample.tail}
        </p>
      </div>

      {anchor && stage === 0 ? (
        <>
          <button
            type="button"
            key={`chip-${sampleKey}`}
            className="xs-chip"
            style={{ top: Math.max(8, anchor.phraseTop - 46), left: Math.max(8, anchor.center - 62) }}
            onClick={onExplain}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t('reader.explain.action')}
          </button>
          <MousePointer2
            key={`cursor-${sampleKey}`}
            aria-hidden
            className="xs-cursor"
            style={{ top: anchor.phraseTop + 6, left: anchor.center + 40 }}
          />
        </>
      ) : null}

      {anchor && stage > 0 ? (
        <div
          key={`card-${sampleKey}`}
          className={cn('explain-card xs-card', sheet ? 'xs-card--sheet' : 'xs-card--pop')}
          style={sheet ? undefined : { top: anchor.top, left: anchor.left }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="explain-eyebrow">{sample.eyebrow}</p>
              <p className="explain-phrase" lang={sampleKey}>
                {sample.phrase}
              </p>
            </div>
            <button
              type="button"
              className="icon-btn icon-btn-sm -mt-1 -mr-1"
              onClick={onClose}
              aria-label={t('reader.explain.close')}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="mt-2">
            {loading ? (
              <div className="space-y-2 pt-1">
                <span className="explain-line w-[88%]" />
                <span className="explain-line w-[60%]" />
              </div>
            ) : (
              <p className="explain-text xs-fade-in" lang={sampleKey}>
                {sample.explanation}
              </p>
            )}
          </div>

          {!loading && stage === 1 ? (
            <button type="button" className="explain-reveal xs-reveal mt-3" onClick={onReveal}>
              <Languages className="h-3.5 w-3.5" aria-hidden />
              {t('reader.explain.showTranslation')}
            </button>
          ) : null}

          {stage === 2 ? (
            <div className="xs-fade-in mt-3">
              <div className="hairline mb-3" aria-hidden />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="explain-eyebrow">{t('reader.explain.translation')}</p>
                <div className="explain-langs flex-wrap" role="radiogroup" aria-label={t('reader.explain.translateTo')}>
                  {targets.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      role="radio"
                      aria-checked={target === item.code}
                      className={cn('explain-lang', target === item.code && 'is-active')}
                      onClick={() => onTarget(item.code)}
                    >
                      {item.short}
                    </button>
                  ))}
                </div>
              </div>
              <p key={target} className="explain-translation xs-fade-in mt-2" lang={target}>
                {translation}
              </p>
            </div>
          ) : null}

          {!loading ? <p className="mt-3 text-[0.6875rem] leading-snug text-faint">{t('reader.explain.disclaimer')}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

/** Decorative phone with the bottom-sheet version of the card. */
function PhoneMock({ sample, sampleKey, target }: { sample: Sample; sampleKey: SampleKey; target: AppLanguage }) {
  return (
    <div aria-hidden className="xs-phone">
      <div className="xs-phone-screen">
        <span className="xs-phone-notch" />
        <div className="xs-phone-lines">
          <span style={{ width: '92%' }} />
          <span style={{ width: '84%' }} />
          <span className="is-mark" style={{ width: '58%' }} />
          <span style={{ width: '88%' }} />
          <span style={{ width: '70%' }} />
        </div>
        <div key={`${sampleKey}-${target}`} className="xs-phone-sheet">
          <p className="xs-phone-eyebrow">{sample.eyebrow}</p>
          <p className="xs-phone-phrase" lang={sampleKey}>
            {sample.phrase}
          </p>
          <p className="xs-phone-text" lang={sampleKey}>
            {sample.explanation}
          </p>
          <p className="xs-phone-translation" lang={target}>
            {sample.translations[target]}
          </p>
        </div>
      </div>
    </div>
  );
}
