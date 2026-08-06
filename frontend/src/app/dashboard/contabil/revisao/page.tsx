'use client';
import { Wand2 } from 'lucide-react';
export default function RevisaoPage() {
  return (
    <div className="text-center py-24 bg-white rounded-xl border border-dashed border-slate-300">
      <Wand2 className="h-12 w-12 mx-auto mb-3 text-teal-400" />
      <h2 className="text-xl font-bold text-slate-900">Revisão de Lançamentos</h2>
      <p className="text-slate-500 mt-1">Wizard passo-a-passo com sugestões automáticas — próxima entrega.</p>
    </div>
  );
}