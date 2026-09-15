// =================================================================
// 📄 LAYOUT RAIZ DO PROJETO (Next.js App Router)
// Este é o "molde" que envolve TODAS as páginas do sistema.
// Tudo que está aqui aparece em todas as telas automaticamente.
// =================================================================

//  BLOCO 1: IMPORTAÇÕES
// Importamos os tipos, fontes, componentes globais e o Sentry (monitoramento de erros)
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import SentryInit from '@/components/SentryInit';

// 🟡 BLOCO 2: CONFIGURAÇÃO DAS FONTES
// Geist Sans = fonte principal (textos normais)
// Geist Mono = fonte monoespaçada (códigos, números)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 🔵 BLOCO 3: METADADOS DO SITE (SEO + Charset)
// ⚠️ ATENÇÃO: A linha `charset: 'UTF-8'` abaixo é CRÍTICA!
// Ela resolve o problema dos caracteres especiais (ç, ã, é) aparecendo como "♦"
export const metadata: Metadata = {
  charset: 'UTF-8', // 🆕 CORREÇÃO: Força o navegador a usar UTF-8 (resolve encoding)
  title: "Radar Conta Certa - Gestão Empresarial",
  description: "Sistema profissional de gestão para escritórios contábeis - Conta Certa Soluções Empresariais",
};

// 🟣 BLOCO 4: COMPONENTE RAIZ (RootLayout)
// Este componente envolve TODAS as páginas do sistema.
// O `children` é o conteúdo da página atual (ex: /memoria, /fale-conosco, etc.)
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 🟤 BLOCO 4.1: Tag HTML raiz
    // lang="pt-BR" define o idioma como português do Brasil (importante para leitores de tela e SEO)
    <html lang="pt-BR">
      
      {/* 🟠 BLOCO 4.2: Tag BODY */}
      {/* Aqui aplicamos as fontes, antialiasing (suavização) e cor de fundo cinza claro */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50`}>
        
        {/* 🔴 BLOCO 4.3: Inicialização do Sentry (monitoramento de erros) */}
        {/* Captura erros em produção e envia para o painel do Sentry */}
        <SentryInit />
        
        {/* 🟢 BLOCO 4.4: Toaster Global (notificações pop-up) */}
        {/* Este componente mostra alertas bonitos (sucesso, erro, aviso) em qualquer página */}
        <Toaster 
          richColors              // Usa cores bonitas (verde=ok, vermelho=erro, amarelo=aviso)
          position="top-right"    // Posição: canto superior direito
          closeButton             // Mostra botão "X" para fechar
          toastOptions={{
            duration: 4000,       // Duração: 4 segundos
            style: {
              background: '#ffffff',  // Fundo branco
              color: '#0f172a',       // Texto escuro
              border: '1px solid #e2e8f0', // Borda cinza clara
            }
          }}
        />
        
        {/* 🔵 BLOCO 4.5: Conteúdo da Página */}
        {/* Aqui é injetado o conteúdo de cada página (page.tsx) que o usuário acessa */}
        {children}
        
      </body>
    </html>
  );
}
// =================================================================
// FIM DO LAYOUT RAIZ
// =================================================================