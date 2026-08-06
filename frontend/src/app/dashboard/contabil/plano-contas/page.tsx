'use client';
import { Network } from 'lucide-react';
export default function PlanoContasPage() {
  return (
    <div className="text-center py-24 bg-white rounded-xl border border-dashed border-slate-300">
      <Network className="h-12 w-12 mx-auto mb-3 text-teal-400" />
      <h2 className="text-xl font-bold text-slate-900">Plano de Contas</h2>
      <p className="text-slate-500 mt-1">Tree View hierárquico + clonagem do plano padrão — próxima entrega.</p>
    </div>
  );
}