import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { DEVICE_COOKIE_NAME } from "@/lib/constants";

export async function getDeviceIdFromCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(DEVICE_COOKIE_NAME)?.value ?? "";
}

export async function touchDeviceIdentity(deviceKey: string) {
  if (!deviceKey) {
    return null;
  }

  return prisma.deviceIdentity.upsert({
    where: { deviceKey },
    update: { lastSeenAt: new Date() },
    create: { deviceKey },
  });
}
