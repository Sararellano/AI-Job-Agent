import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const APP_ROUTES = ["/profile", "/jobs", "/applications", "/dashboard"];
const ONBOARDING_ROUTE = "/onboarding";

function isAppRoute(pathname: string): boolean {
  return APP_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function middleware(request: NextRequest) {
  const sessionResponse = await updateSession(request);
  const redirectLocation = sessionResponse.headers.get("location");

  if (redirectLocation?.includes("/login")) {
    return sessionResponse;
  }

  const pathname = request.nextUrl.pathname;

  if (!isAppRoute(pathname) && pathname !== ONBOARDING_ROUTE) {
    return sessionResponse;
  }

  const supabase = await import("@supabase/ssr").then(({ createServerClient }) =>
    createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // Read-only cookie access in guard layer
          },
        },
      }
    )
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return sessionResponse;
  }

  const { data: settings } = await supabase
    .from("user_document_settings")
    .select("onboarding_completed")
    .eq("user_id", user.id)
    .maybeSingle();

  const completed = settings?.onboarding_completed ?? false;

  if (!completed && isAppRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = ONBOARDING_ROUTE;
    return NextResponse.redirect(url);
  }

  if (pathname === "/jobs/explore" || pathname === "/dashboard") {
    const url = request.nextUrl.clone();
    url.pathname = "/profile";
    return NextResponse.redirect(url);
  }

  if (completed && pathname === ONBOARDING_ROUTE) {
    const url = request.nextUrl.clone();
    url.pathname = "/profile";
    return NextResponse.redirect(url);
  }

  if (
    redirectLocation &&
    (pathname.startsWith("/login") || pathname.startsWith("/register"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = completed ? "/profile" : ONBOARDING_ROUTE;
    return NextResponse.redirect(url);
  }

  return sessionResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
