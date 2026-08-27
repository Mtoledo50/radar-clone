/**
 * =================================================================
 * Hook useHelpModal — Gerencia estado e detecta página atual
 * =================================================================
 * Uso:
 *   const { isOpen, openHelp, closeHelp, content } = useHelpModal();
 *
 * O hook detecta automaticamente a rota atual e carrega o conteúdo
 * correspondente do helpContentMap.
 * =================================================================
 */
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { helpContentMap, HelpContent } from '@/config/helpContent';

export function useHelpModal() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [currentContent, setCurrentContent] = useState<HelpContent | null>(null);

  useEffect(() => {
    // Quando mudar de página, carrega o conteúdo correto
    const content = helpContentMap[pathname];
    setCurrentContent(content || null);
  }, [pathname]);

  const openHelp = () => setIsOpen(true);
  const closeHelp = () => setIsOpen(false);

  return {
    isOpen,
    openHelp,
    closeHelp,
    content: currentContent,
  };
}