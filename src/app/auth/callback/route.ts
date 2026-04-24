import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const matricola = searchParams.get("matricola");
  // if "next" is in param, use it, otherwise use the base URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && matricola) {
      // Link user to socio after email confirmation
      const { error: linkError } = await supabase
        .rpc('link_user_to_socio', { p_matricola_socio: matricola });
      
      if (linkError) {
        console.error('Error linking user to socio:', linkError);
      }
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
