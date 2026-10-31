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
const cache = new Map<string, string>();

let client: GoogleGenAI | null = null;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  client ??= new GoogleGenAI({ apiKey, httpOptions: { timeout: 30_000 } });
  return client;
}

type Language = 'en' | 'fi';

type ExplainBody = {
  selection?: unknown;
  context?: unknown;
  language?: unknown;
  level?: unknown;
  title?: unknown;
};

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

function remember(key: string, value: string) {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, value);
}

const SYSTEM: Record<Language, string> = {
  en: `You help language learners read an adapted English book (CEFR A2–B1).
The reader selected a word or phrase they do not understand. Explain what it means in this exact place in the story, using the passage around it.

Write in very simple English (A2): short sentences, the 1500 most common words, no idioms, no grammar terms.
- Start with the meaning in this context, in one or two sentences.
- If the words have a different usual meaning, or are an idiom, phrasal verb or figure of speech, say so in one short sentence.
- If it helps, add one very short example sentence on a new line that starts with "Example:".
Keep the whole answer under 70 words. Plain text only: no markdown, no headings, no quotes around the answer. Do not repeat the question or the passage.`,
  fi: `Autat kielenoppijaa, joka lukee selkokielistä suomenkielistä kirjaa (CEFR A2–B1).
Lukija valitsi sanan tai ilmauksen, jota hän ei ymmärrä. Selitä, mitä se tarkoittaa juuri tässä kohdassa tarinaa. Käytä apuna ympäröivää tekstiä.

Kirjoita hyvin helppoa selkosuomea (A2): lyhyitä lauseita, yleisiä sanoja, ei idiomeja eikä kielioppitermejä.
- Aloita merkityksellä tässä yhteydessä, yhdellä tai kahdella lauseella.
- Jos sana on taivutettu, kerro sen perusmuoto lyhyesti (esim. "Perusmuoto: talo").
- Jos ilmaus on idiomi tai sillä on tavallisesti eri merkitys, sano se yhdellä lyhyellä lauseella.
- Jos se auttaa, lisää uudelle riville yksi hyvin lyhyt esimerkkilause, joka alkaa sanalla "Esimerkki:".
Koko vastaus alle 60 sanaa. Pelkkää tekstiä: ei markdownia, ei otsikoita. Älä toista kysymystä tai tekstiä.`,
};

function userPrompt(language: Language, selection: string, context: string, title: string, level: string) {
  const book = title ? `${title}${level ? ` (${level})` : ''}` : level;
  if (language === 'fi') {
    return [
      book ? `Kirja: ${book}` : '',
      context ? `Teksti:\n<passage>\n${context}\n</passage>` : '',
      `Valittu kohta: <selection>${selection}</selection>`,
      'Selitä valittu kohta.',
    ]
      .filter(Boolean)
      .join('\n\n');
  }
  return [
    book ? `Book: ${book}` : '',
    context ? `Passage:\n<passage>\n${context}\n</passage>` : '',
    `Selected: <selection>${selection}</selection>`,
    'Explain the selected words.',
  ]
    .filter(Boolean)
    .join('\n\n');
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

  if (!selection || selection.length > MAX_SELECTION) {
    res.status(400).json({ error: 'bad_selection' });
    return;
  }

  const key = JSON.stringify([language, title, selection.toLowerCase(), context]);
  const cached = cache.get(key);
  if (cached) {
    res.json({ explanation: cached, cached: true });
    return;
  }

  if (!allow(req.ip ?? 'unknown')) {
    res.status(429).json({ error: 'rate_limited' });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: userPrompt(language, selection, context, title, level),
      config: {
        systemInstruction: SYSTEM[language],
        maxOutputTokens: 1024,
        // Short, simple answers: little thinking keeps it quick and cheap.
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    if (response.promptFeedback?.blockReason) {
      res.status(422).json({ error: 'refused' });
      return;
    }

    const explanation = (response.text ?? '').trim();
    if (!explanation) {
      res.status(502).json({ error: 'empty' });
      return;
    }

    remember(key, explanation);
    res.json({ explanation });
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
