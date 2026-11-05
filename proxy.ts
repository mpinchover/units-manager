import { NextResponse, type NextRequest } from "next/server";

/**
 * API mode only: bounce requests without a session cookie to /login (an optimistic check;
 * the Flask API verifies the session on every call). In demo mode the session lives in the
 * browser (Firebase), so the app shell checks it client-side instead.
 */
export function proxy(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === "api" && !request.cookies.has("pp_session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
