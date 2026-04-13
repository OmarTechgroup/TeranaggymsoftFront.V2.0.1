import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    const isAuthenticated = !!token;
    const isAuthPage = request.nextUrl.pathname.startsWith("/login");

    if (isAuthPage && isAuthenticated) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (!isAuthPage && !isAuthenticated) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next|api|login|_static).*)'],
}
