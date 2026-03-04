import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using legacy JWT anon key (works for DB queries)
export const supabaseServer = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
