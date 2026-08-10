'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { X, Save, Loader2, Trash2, AlertTriangle, Pencil } from 'lucide-react';
import api from '@/lib/axios';

/**
 * =================================================================
 * ✏️ ProductEditModal — Manutenção Manual de Produto (Sprint 16)
 * =================================================================
 * Edição de TODOS os campos: código (pode limpar), descrição, NCM,
 * unidade, saldo (gera ajuste auditável) e custo médio.
 * + Exclusão (soft delete) com confirmação em 2 cliques.
 * =================================================================
 */
interface EditableProduct {
  id: string;
  code: string;
  description: string;
  ncm: string;
  unit: string;
  currentStock: number;
  averageCost: number;
}

interface Props {
  product: EditableProduct;
  onClose: () => void;
  onSaved: () => void;
}

export default function ProductEditModal({ product, onClose, onSaved }: Props) {
  const [code, setCode] = useState(product.code || '');
  const [description, setDescription] = useState(product.description || '');
  const [ncm, setNcm] = useState(product.ncm || '');
  const [unit, setUnit] = useState(product.unit || 'UN');
  const [quantity, setQuantity] = useState(String(product.currentStock));
  const [averageCost, setAverageCost] = useState(String(product.averageCost));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 💾 Salvar alterações (PUT /fiscal/inventory/products/:id)
  const handleSave = async () => {
    if (!description.trim()) {
      toast.error('Descrição é obrigatória.');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/fiscal/inventory/products/${product.id}`, {
        code,
        description: description.trim(),
        ncm: ncm.trim(),
        unit: unit.trim() || 'UN',
        quantity: parseFloat(quantity) || 0,
        averageCost: parseFloat(averageCost) || 0,
      });
      toast.success('Produto atualizado com sucesso!');
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao atualizar o produto.');
    } finally {
      setSaving(false);
    }
  };

  // 🗑️ Excluir (DELETE /fiscal/inventory/products/:id)
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/fiscal/inventory/products/${product.id}`);
      toast.success('Produto excluído do catálogo.');
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao excluir o produto.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Pencil className="h-5 w-5 text-teal-600" />
              Editar Produto
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Alterações de saldo geram movimentação de ajuste (auditoria).
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Código (vazio = sem código)
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Ex: 190047200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Unidade</label>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="UN, RL, PC..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Descrição *</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">NCM</label>
            <input
              value={ncm}
              onChange={(e) => setNcm(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="00000000"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Saldo (qtd)</label>
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Atual: {product.currentStock} — diferença vira ajuste
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Custo Médio (R$)</label>
              <input
                type="number"
                step="any"
                value={averageCost}
                onChange={(e) => setAverageCost(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Zona de perigo */}
          <div className="border border-red-200 bg-red-50/50 rounded-lg p-3">
            {confirmDelete ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-red-700 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Excluir do catálogo? (histórico preservado)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs px-2 py-1 border border-slate-300 rounded text-slate-600"
                  >
                    Não
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-xs px-2 py-1 bg-red-600 text-white rounded disabled:opacity-50"
                  >
                    {deleting ? 'Excluindo...' : 'Sim, excluir'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir produto do catálogo
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 p-5 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}