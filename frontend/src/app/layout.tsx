import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import SentryInit from '@/components/SentryInit';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Radar Conta Certa - Gestão Empresarial",
  description: "Sistema profissional de gestão para escritórios contábeis - Conta Certa Soluções Empresariais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50`}>
        {/* TOASTER: Componente global que renderiza as notificações */}
        <SentryInit />
        <Toaster 
          richColors 
          position="top-right" 
          closeButton 
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
            }
          }}
        />
        {children}
      </body>
    </html>
  );
}