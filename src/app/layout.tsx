import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { OfficeFrame } from "@/components/office-frame";
import "./globals.css";

const sans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-sans",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Whitehall Education System",
  description: "School register for Whitehall Education System, Karak, Khyber Pakhtunkhwa.",
  applicationName: "Whitehall Education System",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "Whitehall",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0c1f6b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        <OfficeFrame>{children}</OfficeFrame>
      </body>
    </html>
  );
}
