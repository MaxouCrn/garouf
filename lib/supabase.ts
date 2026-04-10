import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Ensure the user has an anonymous session.
 * Call this once at app startup. If a session already exists, it's reused.
 */
export async function ensureAnonymousSession(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw new Error(`Anonymous auth failed: ${error.message}`);
  return data.session!.user.id;
}
