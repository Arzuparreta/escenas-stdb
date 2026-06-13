import type { Metadata, Viewport } from "next";
import { Inter, Oswald, Rye } from "next/font/google";
import "./globals.css";

import { GrainOverlay } from "@/components/GrainOverlay";
import { MarqueeHeader } from "@/components/MarqueeHeader";
import { CreditsFooter } from "@/components/CreditsFooter";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

const rye = Rye({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-rye",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Escenas — El Archivo de cine",
  description:
    "Un archivo de cine curado a mano. Busca escenas por frase, película o director.",
};

export const viewport: Viewport = {
  themeColor: "#0c0a07",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${oswald.variable} ${rye.variable}`}>
      <body>
        <GrainOverlay />
        <div className="relative flex min-h-dvh flex-col">
          <MarqueeHeader />
          <div className="flex-1">{children}</div>
          <CreditsFooter />
        </div>
      </body>
    </html>
  );
}
