// src/app/layout.tsx
import type { Metadata } from "next";
import { Sora, Manrope } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AppearanceProvider } from "@/components/providers/AppearanceProvider";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SeuGerente - Sistema de Gestão",
  description: "Sistema completo de gestão para restaurantes e estabelecimentos",
};

const themeBootstrap = `try{var c=JSON.parse(localStorage.getItem("seugerente:aparencia")||"{}");var r=document.documentElement;r.dataset.tema=c.tema==="claro"?"claro":"escuro";if(c.densidade)r.dataset.densidade=c.densidade;if(c.reduzirAnimacoes)r.dataset.reduzirAnimacoes="true";if(c.bordas)r.style.setProperty("--radius",{reta:"0.25rem",suave:"0.5rem",arredondada:"0.875rem"}[c.bordas]||"0.875rem");if(c.corDestaque)r.style.setProperty("--primary",c.corDestaque);}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-tema="escuro" suppressHydrationWarning>
      <head>
        <Script id="theme-bootstrap" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className={`${sora.variable} ${manrope.variable} antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <AppearanceProvider>{children}</AppearanceProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
