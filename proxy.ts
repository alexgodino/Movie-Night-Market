import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEVICE_COOKIE_NAME } from "@/lib/constants";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  if (!request.cookies.get(DEVICE_COOKIE_NAME)) {
    response.cookies.set(DEVICE_COOKIE_NAME, crypto.randomUUID(), {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
