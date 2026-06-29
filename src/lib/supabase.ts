import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Usiamo il client a cookie di @supabase/ssr (non più localStorage di supabase-js):
// così la sessione è condivisa con middleware e /auth/callback (anch'essi @supabase/ssr,
// flow PKCE). Senza questo, la conferma email scriveva la sessione nei cookie mentre
// header e pagine la cercavano in localStorage -> utente "non loggato".
export const supabase = createBrowserClient(supabaseUrl, supabaseKey)
