import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/casino/app-shell";
import { Providers } from "@/components/casino/providers";
import { Toaster } from "@/components/ui/toaster";
import { WinOverlay } from "@/components/fx/win-overlay";

export const metadata: Metadata = {
  title: {
    default: "LumenPlay — Demo Casino (No Real Money)",
    template: "%s · LumenPlay Demo Casino",
  },
  description:
    "LumenPlay ist ein reines Demo-/Social-Casino. Alle Guthaben, Einsätze und Gewinne sind virtuelle Werte ohne realen Gegenwert. Keine Einzahlungen, keine Auszahlungen.",
  applicationName: "LumenPlay Demo Casino",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0a12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
          <Toaster />
          <WinOverlay />
        </Providers>
      </body>
    </html>
  );
}
