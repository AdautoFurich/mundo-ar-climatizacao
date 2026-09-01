import type { Metadata } from "next";

import "./globals.css";

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
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
