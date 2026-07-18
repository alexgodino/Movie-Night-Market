import type { Metadata, Viewport } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import { DeviceIdentityBootstrap } from "@/components/device-identity-bootstrap";
import { DEVICE_COOKIE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Movie Night Market",
  description:
    "A phone-first family movie picker with anonymous voting, live results, and admin controls.",
};

// Explicit viewport declaration. Without this, some mobile browsers render
// the page at a virtual desktop width (~980px), which makes tap targets land
// in the wrong places and can make buttons feel "unresponsive".
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#fff9f0",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const deviceId = cookieStore.get(DEVICE_COOKIE_NAME)?.value ?? "";

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[var(--surface-2)] text-[var(--ink-1)]">
        <DeviceIdentityBootstrap initialDeviceId={deviceId} />
        {children}
      </body>
    </html>
  );
}
