import { env } from '@/config/env';
import type { BookLanguage, CefrLevel } from '@/types/book';

export type ExplainRequest = {
  selection: string;
  context: string;
  language: BookLanguage;
  level: CefrLevel;
  title: string;
};

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

  const data = (await response.json()) as { explanation?: string };
  if (!data.explanation) throw new ExplainError('failed');
  return data.explanation;
}
