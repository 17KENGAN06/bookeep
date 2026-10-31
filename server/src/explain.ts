import { ApiError, GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { Request, Response } from 'express';

// The alias always points at Google's current Flash model; set GEMINI_MODEL to pin one.
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

const MAX_SELECTION = 400;
const MAX_CONTEXT = 2400;
const MAX_TITLE = 200;

// Per-IP budget: the reader is public, so this is what keeps the API bill bounded.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = Number(process.env.EXPLAIN_LIMIT_PER_10MIN) || 40;
const hits = new Map<string, number[]>();

// Same word in the same sentence of the same book is asked about often; answer it once.
const CACHE_LIMIT = 1000;
const cache = new Map<string, ExplainResult>();

let client: GoogleGenAI | null = null;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  client ??= new GoogleGenAI({ apiKey, httpOptions: { timeout: 30_000 } });
  return client;
}

type Language = 'en' | 'fi';
type Target = 'en' | 'fi' | 'ru' | 'uk';

const TARGETS: Target[] = ['en', 'fi', 'ru', 'uk'];

const LANGUAGE_NAME: Record<Target, string> = {
  en: 'English',
  fi: 'Finnish',
  ru: 'Russian',
  uk: 'Ukrainian',
};

type ExplainBody = {
  selection?: unknown;
  context?: unknown;
  language?: unknown;
  target?: unknown;
  level?: unknown;
  title?: unknown;
};

type ExplainResult = { explanation: string; translation: string };

function text(value: unknown, max: number) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function allow(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((time) => now - time >= WINDOW_MS)) hits.delete(key);
    }
  }
  return true;
}

function remember(key: string, value: ExplainResult) {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, value);
}

const EXPLAIN_RULES: Record<Language, string> = {
  en: `Write "explanation" in very simple English (A2) and keep it as short as possible: one sentence, two at most, under 25 words in total.
Say only what the words mean in this place in the story. Use the most common words, no idioms, no grammar terms, no examples.`,
  fi: `Write "explanation" in very easy Finnish (selkosuomi, A2) and keep it as short as possible: one sentence, two at most, under 20 words in total.
Say only what the words mean in this place in the story. If a word is inflected, you may add its base form in brackets, for example "(talo)". Common words, no idioms, no grammar terms, no examples.`,
};

function systemPrompt(language: Language, target: Target | null) {
  const book = LANGUAGE_NAME[language];
  return [
    `You help language learners read an adapted ${book} book (CEFR A2–B1).`,
    'The reader selected a word or phrase. Use the passage around it to understand what it means in this exact place in the story.',
    'Return JSON with two string fields: "explanation" and "translation".',
    '',
    EXPLAIN_RULES[language],
    '',
    target
      ? `Write "translation" in ${LANGUAGE_NAME[target]}: translate the selected words as they are meant in this passage (not every dictionary sense). For a word or short phrase give just the translation, a few words at most; for a sentence give a natural full translation. If the selection is part of a fixed expression, translate the whole expression and nothing else.`
      : 'Set "translation" to an empty string.',
    '',
    'Plain text inside the fields: no markdown, no quotes around the text. Do not repeat the question or the passage.',
  ].join('\n');
}

function userPrompt(selection: string, context: string, title: string, level: string) {
  const book = title ? `${title}${level ? ` (${level})` : ''}` : level;
  return [
    book ? `Book: ${book}` : '',
    context ? `Passage:\n<passage>\n${context}\n</passage>` : '',
    `Selected: <selection>${selection}</selection>`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    explanation: { type: 'string' },
    translation: { type: 'string' },
  },
  required: ['explanation', 'translation'],
};

function parseResult(raw: string | undefined): ExplainResult | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<ExplainResult>;
    const explanation = typeof data.explanation === 'string' ? data.explanation.trim() : '';
    const translation = typeof data.translation === 'string' ? data.translation.trim() : '';
    if (!explanation && !translation) return null;
    return { explanation, translation };
  } catch {
    return null;
  }
}

export async function explainHandler(req: Request, res: Response) {
  const ai = getClient();
  if (!ai) {
    res.status(503).json({ error: 'not_configured' });
    return;
  }

  const body = (req.body ?? {}) as ExplainBody;
  const selection = text(body.selection, MAX_SELECTION + 1);
  const context = text(body.context, MAX_CONTEXT);
  const title = text(body.title, MAX_TITLE);
  const level = body.level === 'A2' || body.level === 'B1' ? body.level : '';
  const language: Language = body.language === 'fi' ? 'fi' : 'en';
  // No translation into the book's own language: the explanation already covers it.
  const target =
    TARGETS.includes(body.target as Target) && body.target !== language ? (body.target as Target) : null;

  if (!selection || selection.length > MAX_SELECTION) {
    res.status(400).json({ error: 'bad_selection' });
    return;
  }

  const key = JSON.stringify([language, target, title, selection.toLowerCase(), context]);
  const cached = cache.get(key);
  if (cached) {
    res.json({ ...cached, cached: true });
    return;
  }

  if (!allow(req.ip ?? 'unknown')) {
    res.status(429).json({ error: 'rate_limited' });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: userPrompt(selection, context, title, level),
      config: {
        systemInstruction: systemPrompt(language, target),
        responseMimeType: 'application/json',
        responseJsonSchema: RESPONSE_SCHEMA,
        maxOutputTokens: 1024,
        // Short, simple answers: little thinking keeps it quick and cheap.
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    if (response.promptFeedback?.blockReason) {
      res.status(422).json({ error: 'refused' });
      return;
    }

    const result = parseResult(response.text);
    if (!result) {
      res.status(502).json({ error: 'empty' });
      return;
    }

    remember(key, result);
    res.json(result);
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) {
      res.status(429).json({ error: 'rate_limited' });
      return;
    }
    if (error instanceof ApiError) {
      console.error('Explain request failed', error.status, error.message);
    } else {
      console.error('Explain request failed', error);
    }
    res.status(502).json({ error: 'upstream' });
  }
}
