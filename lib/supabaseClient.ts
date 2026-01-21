
import { createClient } from '@supabase/supabase-js'

// Safe access to environment variables
const getEnv = (key: string) => {
    try {
        // Defensive check: ensure import.meta and import.meta.env exist
        if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
            return (import.meta as any).env[key] || '';
        }
        return '';
    } catch (e) {
        console.warn('Error accessing environment variable:', key);
        return '';
    }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Check if keys exist
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '';

if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase keys are missing or invalid! App will run in Mock Mode.');
}

// Initialize with real keys or placeholders to prevent crash
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseAnonKey || 'placeholder-key'
);
