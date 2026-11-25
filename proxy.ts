import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/dashboard")) {
    const session = await auth();
    if (!session.userId) {
      return session.redirectToSignIn();
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
