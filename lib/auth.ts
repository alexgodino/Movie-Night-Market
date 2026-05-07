import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME } from "@/lib/constants";

function getExpectedPasscode() {
  return process.env.ADMIN_PASSCODE?.trim() || "popcorn";
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === getExpectedPasscode();
}

export async function requireAdmin() {
  const ok = await isAdminAuthenticated();

  if (!ok) {
    redirect("/admin/login");
  }
}

export async function setAdminCookie(passcode: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, passcode, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function isValidAdminPasscode(value: string) {
  return value.trim() === getExpectedPasscode();
}
