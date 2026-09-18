import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { getSupabaseClient } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export function authRedirectTo() {
  return makeRedirectUri({
    scheme: 'bookeep',
    path: 'auth/callback',
  });
}

export async function createSessionFromUrl(url: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { params, errorCode } = QueryParams.getQueryParams(url);
  const error = errorCode || params.error;
  if (error) {
    throw new Error(params.error_description || String(error));
  }

  if (params.access_token && params.refresh_token) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (sessionError) throw sessionError;
    return;
  }

  if (params.code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
    if (exchangeError) throw exchangeError;
  }
}

export async function signInWithGoogle() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase is not configured');

  const redirectTo = authRedirectTo();
  if (__DEV__) console.log('[auth] redirectTo', redirectTo);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data.url) throw new Error('Google sign-in did not start');
  if (__DEV__) console.log('[auth] authorize', data.url);

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (__DEV__) console.log('[auth] result', result.type, result.type === 'success' ? result.url : '');
  if (result.type !== 'success') return false;
  await createSessionFromUrl(result.url);
  return true;
}
