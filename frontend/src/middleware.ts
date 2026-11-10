import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/", "/logout"];

/** Rota inicial de cada papel depois do login. */
function homeFor(role?: string) {
  return role === "volunteer" ? "/me" : "/dashboard";
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  const role = req.cookies.get("user_role")?.value;
  const pathname = req.nextUrl.pathname;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const hasLogoutParam =
    req.nextUrl.searchParams.get("logout") === "1" ||
    req.nextUrl.searchParams.get("action") === "logout";

  if (pathname === "/logout" || hasLogoutParam) {
    const response = NextResponse.redirect(new URL("/?logged_out=1", req.url));
    response.cookies.set("auth_token", "", { path: "/", maxAge: 0 });
    response.cookies.set("user_role", "", { path: "/", maxAge: 0 });
    return response;
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL(token ? homeFor(role) : "/", req.url));
  }

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (token && isPublic) {
    return NextResponse.redirect(new URL(homeFor(role), req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)"],
};
