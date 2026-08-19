'use client';

import { useState } from 'react';
import CloseProposalModal from '@/components/proposals/CloseProposalModal';

export default function TestClosePage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste do Modal de Fechamento</h1>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-teal-600 text-white rounded-lg"
      >
        Abrir Modal
      </button>

      {open && (
        <CloseProposalModal
          proposalId="PROP-202608-0005"
          proposalNumber="PROP-202608-0005"
          clientName="Cliente Teste A4"
          basePrice={2800}
          onClose={() => setOpen(false)}
          onClosed={() => {
            setOpen(false);
            alert('Proposta fechada com sucesso!');
          }}
        />
      )}
    </div>
  );
}