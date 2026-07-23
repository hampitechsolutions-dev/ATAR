import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ATAR | Red Comercial Industrial",
  description:
    "Plataforma B2B industrial para gestionar demanda, cotizaciones, CRM comercial y operacion multiplataforma.",
  manifest: "/manifest.webmanifest",
  applicationName: "ATAR",
  appleWebApp: {
    // iOS no lee el manifest: necesita estos meta para abrir sin barra de
    // Safari y para mostrar el titulo correcto en la pantalla de inicio.
    capable: true,
    title: "ATAR",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/logoatar.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0060f0",
  // viewportFit=cover + safe-area en el body evita que el contenido quede
  // debajo del notch cuando corre instalada en standalone.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full overflow-x-hidden antialiased`}>
      <body className="min-h-full flex flex-col overflow-x-hidden bg-white text-slate-950">
        <AuthProvider>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
