import { env } from '@/config/env';
import { getSupabaseClient } from '@/services/supabase';
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

export type ExplainResult = {
  explanation: string;
  translation: string;
  /** The server left the translation out: it comes with the subscription. */
  translationLocked?: boolean;
};

export type ExplainErrorCode = 'rate_limited' | 'daily_limit' | 'not_configured' | 'failed';

export class ExplainError extends Error {
  code: ExplainErrorCode;

  constructor(code: ExplainErrorCode) {
    super(code);
    this.code = code;
  }
}

export async function explainSelection(request: ExplainRequest, signal?: AbortSignal) {
  // Signed-in readers send their session: the daily limit and translation follow the account.
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const session = await getSupabaseClient()?.auth.getSession().catch(() => null);
  const token = session?.data.session?.access_token;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${env.apiUrl}/api/explain`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ExplainError('failed');
  }

  if (response.status === 429) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ExplainError(body?.error === 'daily_limit' ? 'daily_limit' : 'rate_limited');
  }
  if (response.status === 503) throw new ExplainError('not_configured');
  if (!response.ok) throw new ExplainError('failed');

  const data = (await response.json()) as Partial<ExplainResult>;
  const result = {
    explanation: typeof data.explanation === 'string' ? data.explanation : '',
    translation: typeof data.translation === 'string' ? data.translation : '',
    translationLocked: data.translationLocked === true,
  };
  if (!result.explanation && !result.translation) throw new ExplainError('failed');
  return result;
}
