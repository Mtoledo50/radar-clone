// =================================================================
// INÍCIO: frontend/src/app/portal/layout.tsx
// =================================================================
/**
 * Layout público do Portal do Cliente
 * Não inclui sidebar nem autenticação de admin
 * =================================================================
 */
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
// =================================================================
// FIM: frontend/src/app/portal/layout.tsx
// =================================================================