import type { Metadata } from "next";
import { Archivo_Narrow, Source_Sans_3 } from "next/font/google";

import "./globals.css";

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const displayFont = Archivo_Narrow({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Mundo Ar | Gestão da oficina",
  description:
    "Sistema de atendimento e ordens de serviço da Mundo Ar Climatização.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${bodyFont.variable} ${displayFont.variable}`}
      lang="pt-BR"
    >
      <body>{children}</body>
    </html>
  );
}
