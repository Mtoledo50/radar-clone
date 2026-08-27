/**
 * =================================================================
 * useLastVisited — Hook para rastrear última página visitada
 * =================================================================
 * Salva no localStorage a última página do Dashboard visitada.
 * Ignora rotas de ajuda (/ajuda/*) e o próprio Dashboard.
 * =================================================================
 */
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export interface LastVisited {
  href: string;
  title: string;
  timestamp: number;
}

// Mapa de rotas → títulos amigáveis
const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard Executivo',
  '/dashboard/minha-empresa': 'Minha Empresa',
  '/dashboard/pessoas': 'Colaboradores',
  '/dashboard/turnover': 'Turnover',
  '/dashboard/pessoas/benchmark': 'Benchmark de Cargos',
  '/dashboard/clientes': 'Carteira de Clientes',
  '/dashboard/projetos': 'Projetos',
  '/dashboard/tarefas': 'Tarefas',
  '/dashboard/precificacao': 'Precificação',
  '/dashboard/precificacao/meus-planos': 'Meus Planos',
  '/dashboard/precificacao/desempenho': 'Desempenho Comercial',
  '/dashboard/planejamento': 'Planejamento',
  '/dashboard/fiscal': 'Importar NF-e',
  '/dashboard/fiscal/notas': 'Notas Fiscais',
  '/dashboard/fiscal/estoque': 'Estoque',
  '/dashboard/fiscal/apuracao': 'Apuração ICMS',
  '/dashboard/fiscal/sped': 'SPED Fiscal',
  '/dashboard/fechamento': 'Fechamento + DRE Bancário',
  '/dashboard/lancamentos': 'Lançamentos Contábeis',
  '/dashboard/contabil/plano-contas': 'Plano de Contas',
  '/dashboard/funcionario-digital': 'Dashboard da Aurora',
  '/dashboard/funcionario-digital/aprovacoes': 'Central de Aprovações',
  '/dashboard/funcionario-digital/relatorios': 'Relatórios Mensais',
  '/dashboard/funcionario-digital/nfse': 'NFS-e',
  '/dashboard/funcionario-digital/guias': 'Guias de Imposto',
  '/dashboard/funcionario-digital/legalizacao': 'Legalização & Cofre',
  '/dashboard/funcionario-digital/cobranca': 'Cobrança & CNAB',
  '/dashboard/bi': 'DRE do Escritório',
  '/dashboard/bi/dre-cliente': 'DRE do Cliente',
  '/dashboard/ponto-fora-da-curva': 'Ponto Fora da Curva',
  '/dashboard/indicadores': 'Indicadores',
  '/dashboard/indicadores-custom': 'Indicadores Customizados',
  '/dashboard/score': 'Score do Escritório',
  '/dashboard/mentoria': 'Visão de Futuro',
  '/dashboard/ranking': 'Ranking de Níveis',
  '/dashboard/planejamento-tributario': 'Planejamento Tributário',
  '/dashboard/reforma-tributaria': 'Reforma Tributária',
  '/dashboard/admin': 'Administração',
};

export function useLastVisited() {
  const pathname = usePathname();
  const [last, setLast] = useState<LastVisited | null>(null);

  useEffect(() => {
    // 1. Carrega do localStorage na montagem
    try {
      const saved = localStorage.getItem('last-visited');
      if (saved) {
        const parsed = JSON.parse(saved);
        setLast(parsed);
      }
    } catch {}

    // 2. Salva a página atual se for uma rota válida do dashboard
    // (exceto o próprio /dashboard e rotas de /ajuda)
    if (
      pathname !== '/dashboard' &&
      pathname.startsWith('/dashboard') &&
      !pathname.startsWith('/ajuda') &&
      ROUTE_TITLES[pathname]
    ) {
      const title = ROUTE_TITLES[pathname];
      const entry: LastVisited = {
        href: pathname,
        title,
        timestamp: Date.now(),
      };
      localStorage.setItem('last-visited', JSON.stringify(entry));
      setLast(entry);
    }
  }, [pathname]);

  return last;
}