import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic check only: bounce requests without a session cookie to /login.
 * Real authorization happens in the Data Access Layer (requireUser) on every page, action and route.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("pp_session")) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
