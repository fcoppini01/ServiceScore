import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Aggiorna/valida la sessione (rinnovo cookie per gli utenti loggati)
  const { data: { user } } = await supabase.auth.getUser();

  // Protezione accesso: senza login si può stare solo su login/registrazione/callback
  // e sugli asset statici (immagini ecc.). Tutto il resto → redirect al login.
  const { pathname } = request.nextUrl;
  const isPublicRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/auth/");
  const isStaticAsset = /\.[a-zA-Z0-9]+$/.test(pathname); // es. /logo_ufficiale.png

  if (!user && !isPublicRoute && !isStaticAsset) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    const redirectResponse = NextResponse.redirect(loginUrl);
    // Porta con sé eventuali cookie di sessione impostati sopra
    response.cookies.getAll().forEach((c) => redirectResponse.cookies.set(c));
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
