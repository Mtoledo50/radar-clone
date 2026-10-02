# ADR-043: White-Label via CSS Variables

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto
O sistema gera propostas comerciais públicas (link compartilhável) e relatórios para clientes. Escritórios diferentes querem que esses documentos reflitam a identidade visual deles (cores do logo, rodapé personalizado), não a identidade do "Radar Conta Certa".

**Problema:** 
Gerar versões estáticas de CSS ou usar inline styles dinâmicos em todos os componentes é lento, difícil de manter e propenso a erros de cache.

## 🎯 Decisão
Implementar **White-Label dinâmico** injetando CSS Variables (`--brand-primary`, `--brand-secondary`, `--brand-footer-text`) no `:root` do documento ou do container da proposta, baseando-se nas configurações da `Company` do usuário logado.

### Regras:
1. As cores padrão (Teal `#0d9488`, Laranja `#f97316`) são aplicadas se o tenant não tiver cores customizadas.
2. O frontend consome essas variáveis via Tailwind (ex: `bg-[var(--brand-primary)]` ou configurando o `tailwind.config.js` para usar CSS vars).
3. O rodapé da proposta pública exibe `--brand-footer-text` se definido.

## 💡 Implementação
```typescript
// frontend/src/app/proposta/[slug]/page.tsx
export default async function PropostaPublica({ params, searchParams }) {
  const proposta = await api.get(`/proposals/public/${params.slug}`);
  const company = proposta.data.company;

  const customStyles = `
    :root {
      --brand-primary: ${company.primaryColor || '#0d9488'};
      --brand-secondary: ${company.secondaryColor || '#f97316'};
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className="bg-[var(--brand-primary)] text-white p-8">
        {/* Conteúdo da proposta */}
      </div>
      <footer className="text-sm text-gray-500">
        {company.proposalFooterText || 'Gerado por Radar Conta Certa'}
      </footer>
    </>
  );
}
✅ Consequências

Positivas: Zero re-renderização de CSS, cache de página funciona perfeitamente, personalização em tempo real.
Negativas: Requer que o design system do frontend seja construído pensando em variáveis, não em cores hardcodadas.

📚 Referências

frontend/src/app/proposta/[slug]/page.tsx
backend/src/company/company.service.ts (endpoints /company/branding)
