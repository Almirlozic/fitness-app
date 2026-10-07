import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

// Ruter, man kan åbne uden at være logget ind
const PUBLIC_PATHS = [
  "/login",
  "/auth/confirm",
  "/auth/callback",
  "/auth/set-password",
  "/forgot-password",
];

const isPublic = (pathname: string) =>
  PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Fornyer sessionen og skriver opdaterede cookies til både request og response
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() validerer tokenet hos Supabase. Brug ikke getSession() til adgangskontrol.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // API-kald får 401 i stedet for en redirect til login-siden
  if (!user && pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Ikke logget ind" }, { status: 401 });
  }
  if (!user && !isPublic(pathname)) {
    return redirectKeepingCookies(request, response, "/login");
  }
  if (user && pathname === "/login") {
    return redirectKeepingCookies(request, response, "/");
  }
  // Vælg adgangskode kræver den session, som linket i mailen opretter
  if (!user && pathname === "/auth/set-password") {
    return redirectKeepingCookies(request, response, "/login", "besked=udloebet");
  }

  return response;
}

/** Redirect, der beholder de cookies, Supabase lige har fornyet */
function redirectKeepingCookies(
  request: NextRequest,
  from: NextResponse,
  pathname: string,
  search = "",
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = search;
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: [
    // Alt undtagen Next's statiske filer, billedoptimering og filer med billed-/ikon-endelser
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|wasm)$).*)",
  ],
};
