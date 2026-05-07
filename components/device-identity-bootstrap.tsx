"use client";

import { useEffect } from "react";
import { DEVICE_COOKIE_NAME } from "@/lib/constants";

type Props = {
  initialDeviceId: string;
};

export function DeviceIdentityBootstrap({ initialDeviceId }: Props) {
  useEffect(() => {
    const existing = window.localStorage.getItem(DEVICE_COOKIE_NAME);
    const resolved = existing || initialDeviceId || crypto.randomUUID();

    window.localStorage.setItem(DEVICE_COOKIE_NAME, resolved);
    document.cookie = `${DEVICE_COOKIE_NAME}=${resolved}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }, [initialDeviceId]);

  return null;
}
