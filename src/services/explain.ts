import { env } from '@/config/env';
import type { BookLanguage, CefrLevel, UiLanguage } from '@/types/book';

export type ExplainRequest = {
  selection: string;
  context: string;
  language: BookLanguage;
  /** Language to translate the selection into; null for no translation. */
  target: UiLanguage | null;
  level: CefrLevel;
  title: string;
};

export type ExplainResult = { explanation: string; translation: string };

export type ExplainErrorCode = 'rate_limited' | 'not_configured' | 'failed';

export class ExplainError extends Error {
  code: ExplainErrorCode;

  constructor(code: ExplainErrorCode) {
    super(code);
    this.code = code;
  }
}

export async function explainSelection(request: ExplainRequest, signal?: AbortSignal) {
  let response: Response;
  try {
    response = await fetch(`${env.apiUrl}/api/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ExplainError('failed');
  }

  if (response.status === 429) throw new ExplainError('rate_limited');
  if (response.status === 503) throw new ExplainError('not_configured');
  if (!response.ok) throw new ExplainError('failed');

  const data = (await response.json()) as Partial<ExplainResult>;
  const result = {
    explanation: typeof data.explanation === 'string' ? data.explanation : '',
    translation: typeof data.translation === 'string' ? data.translation : '',
  };
  if (!result.explanation && !result.translation) throw new ExplainError('failed');
  return result;
}
