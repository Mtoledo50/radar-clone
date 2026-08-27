'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowRight, Clock } from 'lucide-react';

export default function LastVisitedCard() {
  const router = useRouter();
  const pathname = usePathname();
  const [lastPage, setLastPage] = useState<{href: string, title: string, time: number} | null>(null);

  const titles: Record<string, string> = {
    '/dashboard/clientes': 'Carteira de Clientes',
    '/dashboard/projetos': 'Projetos',
    '/dashboard/precificacao': 'Precificação',
    '/dashboard/planejamento': 'Planejamento',
    '/dashboard/minha-empresa': 'Minha Empresa',
    '/dashboard/funcionario-digital/cobranca': 'Cobrança & CNAB',
    '/dashboard/fechamento': 'Fechamento Bancário',
    '/dashboard/pessoas': 'Colaboradores',
    '/dashboard/score': 'Score do Escritório',
  };

  // Lógica unificada: roda SEMPRE que o pathname muda
  useEffect(() => {
    console.log('🔄 Pathname mudou para:', pathname);

    // Se estamos no Dashboard, carrega do localStorage
    if (pathname === '/dashboard') {
      const saved = localStorage.getItem('lastPage');
      console.log('📖 Lendo do localStorage:', saved);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setLastPage(parsed);
          console.log('✅ Carregou:', parsed);
        } catch (e) {
          console.error('Erro ao parsear:', e);
        }
      } else {
        console.log('❌ localStorage vazio');
        setLastPage(null);
      }
    }
    // Se estamos em outra página válida, salva no localStorage
    else if (pathname !== '/dashboard' && titles[pathname]) {
      const data = {
        href: pathname,
        title: titles[pathname],
        time: Date.now()
      };
      localStorage.setItem('lastPage', JSON.stringify(data));
      console.log('✅ Salvou:', data);
    }
  }, [pathname]);

  if (!lastPage) {
    console.log('❌ lastPage é null, não renderizando');
    return null;
  }

  const minutesAgo = Math.floor((Date.now() - lastPage.time) / 60000);
  const timeText = minutesAgo < 1 ? 'agora mesmo' : `há ${minutesAgo}min`;

  console.log('✅ Renderizando card:', lastPage);

  return (
    <div className="bg-gradient-to-br from-teal-50 to-orange-50 border border-teal-200 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase mb-1">
            <Clock className="h-3 w-3" />
            ONDE VOCÊ PAROU
          </div>
          <h3 className="text-lg font-bold text-slate-900">{lastPage.title}</h3>
          <p className="text-sm text-slate-600">Você estava aqui {timeText}</p>
        </div>
        <button
          onClick={() => {
            console.log('🔘 Clicou em Continuar, navegando para:', lastPage.href);
            router.push(lastPage.href);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg"
        >
          Continuar
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}