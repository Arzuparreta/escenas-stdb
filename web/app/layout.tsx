import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Escenas — biblioteca de cine",
  description: "Busca escenas de películas por frase, película o director",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
