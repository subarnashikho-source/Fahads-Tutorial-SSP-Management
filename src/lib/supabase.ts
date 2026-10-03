import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase credentials from Vite/Vercel environment variables
const ENV_SUPABASE_URL =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL) ||
  (typeof process !== 'undefined' &&
    process.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' &&
    process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  '';

const ENV_SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  (typeof process !== 'undefined' &&
    process.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' &&
    process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  '';

// Allow runtime override via System Settings / Admin Control
const STORAGE_URL_KEY = 'ft_ssp_supabase_url';
const STORAGE_ANON_KEY = 'ft_ssp_supabase_anon_key';

export function getSupabaseCredentials(): { url: string; key: string } {
  const customUrl =
    typeof window !== 'undefined'
      ? localStorage.getItem(STORAGE_URL_KEY)
      : null;

  const customKey =
    typeof window !== 'undefined'
      ? localStorage.getItem(STORAGE_ANON_KEY)
      : null;

  const url =
    customUrl && customUrl.trim() !== ''
      ? customUrl.trim()
      : ENV_SUPABASE_URL ||
        'https://kbqoxadfqpsufwhsxxwa.supabase.co';

  const key =
    customKey && customKey.trim() !== ''
      ? customKey.trim()
      : ENV_SUPABASE_ANON_KEY ||
        'sb_publishable_KO3tMZ-rz172-Dvht1HI-Q_0qz_rExf';

  return { url, key };
}

export function saveSupabaseCredentials(url: string, key: string) {
  if (typeof window !== 'undefined') {
    if (url) {
      localStorage.setItem(STORAGE_URL_KEY, url.trim());
    } else {
      localStorage.removeItem(STORAGE_URL_KEY);
    }

    if (key) {
      localStorage.setItem(STORAGE_ANON_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_ANON_KEY);
    }

    reinitializeSupabase();
  }
}

export function isLiveSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();

  return Boolean(
    url &&
      key &&
      url.includes('supabase.co') &&
      !url.includes('mock-ssp-project') &&
      key !== 'mock-anon-key-ssp-fahad-2026'
  );
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const { url, key } = getSupabaseCredentials();

    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseInstance;
}

export function reinitializeSupabase(): SupabaseClient {
  const { url, key } = getSupabaseCredentials();

  supabaseInstance = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseInstance;
}

export const supabase = getSupabaseClient();

// Connection verification helper
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  latencyMs?: number;
  isLive: boolean;
}> {
  const startTime = Date.now();
  const isLive = isLiveSupabaseConfigured();

  if (!isLive) {
    return {
      success: true,
      isLive: false,
      latencyMs: 12,
      message:
        'Running in Local Persistent Storage mode. Configure Supabase URL & Anon Key in System Control for Cloud Sync.',
    };
  }

  try {
    const client = getSupabaseClient();

    const { error } = await client
      .from('system_settings')
      .select('count', { count: 'exact', head: true });

    const latencyMs = Date.now() - startTime;

    if (
      error &&
      error.code !== 'PGRST116' &&
      error.message &&
      !error.message.includes('permission denied')
    ) {
      return {
        success: false,
        isLive: true,
        latencyMs,
        message: `Supabase connection issue: ${error.message}`,
      };
    }

    return {
      success: true,
      isLive: true,
      latencyMs,
      message:
        'Connected to Supabase PostgreSQL Database successfully.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    return {
      success: false,
      isLive: true,
      message: `Failed to connect to Supabase: ${msg}`,
    };
  }
}
