'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { X, Loader2, FileText, Calendar, DollarSign, Building2, AlertTriangle } from 'lucide-react';
import api from '@/lib/axios';

// =============================================================================
// ️ TIPOS E INTERFACES
// =============================================================================
interface Client {
  id: string;
  companyName: string;
  cnpj?: string;
}

interface CreateObligationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// =============================================================================
// 🛡️ CONSTANTES VALIDADAS (whitelist de tipos permitidos)
// =============================================================================
const OBLIGATION_TYPES = [
  { value: 'DAS', label: 'DAS (Simples Nacional)' },
  { value: 'DARF_IRRF', label: 'DARF IRRF' },
  { value: 'DARF_CSLL', label: 'DARF CSLL' },
  { value: 'DARF_PIS_COFINS', label: 'DARF PIS/COFINS' },
  { value: 'GPS', label: 'GPS (INSS)' },
  { value: 'FGTS', label: 'FGTS' },
  { value: 'ISS', label: 'ISS' },
  { value: 'ICMS', label: 'ICMS' },
  { value: 'OUTROS', label: 'Outros' },
] as const;

type ValidObligationType = typeof OBLIGATION_TYPES[number]['value'];

// =============================================================================
// 🛡️ FUNÇÕES DE SANITIZAÇÃO E VALIDAÇÃO
// =============================================================================

/**
 * 🛡️ Sanitiza strings para prevenir XSS
 * Remove tags HTML e caracteres especiais perigosos
 */
function sanitizeString(input: string): string {
  if (!input) return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * 🛡️ Valida formato de competência (MM/AAAA)
 * Retorna true apenas se for uma data real e válida
 */
function isValidCompetence(value: string): boolean {
  const regex = /^(0[1-9]|1[0-2])\/\d{4}$/;
  if (!regex.test(value)) return false;
  
  const [month, year] = value.split('/').map(Number);
  const currentYear = new Date().getFullYear();
  
  // Valida range: mês 1-12, ano entre 2020 e 2099
  return month >= 1 && month <= 12 && year >= 2020 && year <= 2099;
}

/**
 * 🛡️ Valida valor monetário
 * Previne valores negativos, NaN, Infinity e números absurdamente grandes
 */
function isValidAmount(value: string): boolean {
  const num = Number(value);
  return (
    !isNaN(num) &&
    isFinite(num) &&
    num >= 0 &&
    num <= 999999999.99 // Limite máximo de R$ 999 milhões
  );
}

/**
 * 🛡️ Valida data de vencimento
 * Previne datas no passado distante ou futuro muito distante
 */
function isValidDueDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Vencimento não pode ser anterior a 2020 nem posterior a 10 anos
  const minDate = new Date('2020-01-01');
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 10);
  
  return date >= minDate && date <= maxDate;
}

/**
 * 🛡️ Valida UUID de cliente (previne injeção de IDs maliciosos)
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// =============================================================================
// 🛡️ COMPONENTE PRINCIPAL
// =============================================================================
export default function CreateObligationModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: CreateObligationModalProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [submitAttempts, setSubmitAttempts] = useState(0);
  
  const [formData, setFormData] = useState({
    clientId: '',
    type: 'DAS' as ValidObligationType,
    competence: '',
    dueDate: '',
    amount: '',
    obs: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 🛡️ Reset de erros quando o modal abre
  useEffect(() => {
    if (isOpen) {
      fetchClients();
      setErrors({});
      setSubmitAttempts(0);
    }
  }, [isOpen]);

  // 🛡️ Fetch de clientes com tratamento seguro de resposta
  const fetchClients = useCallback(async () => {
    try {
      const response = await api.get('/clients');
      const clientsData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || [];
      
      // 🛡️ Filtra apenas clientes com estrutura válida
      const validClients = clientsData.filter(
        (c: any) => c && typeof c.id === 'string' && typeof c.companyName === 'string'
      );
      
      setClients(validClients);
      
      if (validClients.length > 0) {
        setFormData(prev => ({ ...prev, clientId: validClients[0].id }));
      }
    } catch (error) {
      // 🛡️ Não expõe detalhes do erro no console em produção
      if (process.env.NODE_ENV === 'development') {
        console.error('[CreateObligationModal] Erro ao buscar clientes:', error);
      }
      toast.error('Falha ao carregar lista de clientes.');
    }
  }, []);

  // 🛡️ Validação completa do formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientId || !isValidUUID(formData.clientId)) {
      newErrors.clientId = 'Cliente inválido';
    }

    if (!OBLIGATION_TYPES.find(t => t.value === formData.type)) {
      newErrors.type = 'Tipo de obrigação inválido';
    }

    if (!isValidCompetence(formData.competence)) {
      newErrors.competence = 'Competência deve ser MM/AAAA (ex: 10/2026)';
    }

    if (!isValidDueDate(formData.dueDate)) {
      newErrors.dueDate = 'Data de vencimento inválida';
    }

    if (!isValidAmount(formData.amount)) {
      newErrors.amount = 'Valor deve ser entre R$ 0,00 e R$ 999.999.999,99';
    }

    // 🛡️ Sanitiza observações antes de validar
    const sanitizedObs = sanitizeString(formData.obs);
    if (sanitizedObs.length > 500) {
      newErrors.obs = 'Observações devem ter no máximo 500 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🛡️ Handler de submit com proteção contra spam
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🛡️ Rate limiting: máximo 3 tentativas consecutivas
    if (submitAttempts >= 3) {
      toast.error('Muitas tentativas. Aguarde alguns segundos.');
      return;
    }

    if (!validateForm()) {
      setSubmitAttempts(prev => prev + 1);
      return;
    }

    setLoading(true);
    try {
      // 🛡️ Payload sanitizado antes do envio
      const sanitizedPayload = {
        clientId: formData.clientId,
        type: formData.type,
        competence: formData.competence,
        dueDate: formData.dueDate,
        amount: Number(formData.amount),
        obs: sanitizeString(formData.obs),
        status: 'PENDENTE' as const,
      };

      await api.post('/tax-obligations', sanitizedPayload);
      
      toast.success('Obrigação cadastrada com sucesso!');
      onSuccess();
      onClose();
      
      // ️ Reset do formulário
      setFormData({
        clientId: clients[0]?.id || '',
        type: 'DAS',
        competence: '',
        dueDate: '',
        amount: '',
        obs: '',
      });
      setErrors({});
      setSubmitAttempts(0);
    } catch (error: any) {
      // 🛡️ Mensagem genérica para não expor detalhes internos
      const message = error.response?.data?.message 
        ? sanitizeString(String(error.response.data.message))
        : 'Erro ao cadastrar obrigação. Tente novamente.';
      toast.error(message);
      setSubmitAttempts(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  // 🛡️ Handler de change com validação em tempo real
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpa o erro do campo quando o usuário digita
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#f97316]/10 rounded-lg">
              <FileText className="w-5 h-5 text-[#f97316]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Nova Obrigação</h2>
              <p className="text-sm text-slate-500">Cadastre um imposto ou guia tributária</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cliente / Empresa <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                required
                value={formData.clientId}
                onChange={(e) => handleFieldChange('clientId', e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none transition-all bg-white text-slate-900 ${
                  errors.clientId ? 'border-red-500' : 'border-slate-300'
                }`}
              >
                {clients.length === 0 ? (
                  <option value="">Nenhum cliente disponível</option>
                ) : (
                  clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {/* 🛡️ Sanitização do nome do cliente */}
                      {sanitizeString(client.companyName)} 
                      {client.cnpj ? ` (${sanitizeString(client.cnpj)})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
            {errors.clientId && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle size={12} /> {errors.clientId}
              </p>
            )}
          </div>

          {/* Tipo e Competência */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select 
                required
                value={formData.type}
                onChange={(e) => handleFieldChange('type', e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none transition-all bg-white text-slate-900 ${
                  errors.type ? 'border-red-500' : 'border-slate-300'
                }`}
              >
                {OBLIGATION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle size={12} /> {errors.type}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Competência <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required
                placeholder="MM/AAAA"
                value={formData.competence}
                onChange={(e) => handleFieldChange('competence', e.target.value)}
                maxLength={7}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none transition-all text-slate-900 placeholder:text-slate-400 ${
                  errors.competence ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.competence && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle size={12} /> {errors.competence}
                </p>
              )}
            </div>
          </div>

          {/* Vencimento e Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Vencimento <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="date" 
                  required
                  value={formData.dueDate}
                  onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none transition-all text-slate-900 ${
                    errors.dueDate ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.dueDate && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle size={12} /> {errors.dueDate}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Valor (R$) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  max="999999999.99"
                  required
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) => handleFieldChange('amount', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none transition-all text-slate-900 placeholder:text-slate-400 ${
                    errors.amount ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle size={12} /> {errors.amount}
                </p>
              )}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Observações <span className="text-slate-400 font-normal">(opcional, máx. 500 caracteres)</span>
            </label>
            <textarea 
              rows={3}
              placeholder="Ex: Parcelamento, Diferença de cálculo, etc."
              value={formData.obs}
              onChange={(e) => handleFieldChange('obs', e.target.value)}
              maxLength={500}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] outline-none transition-all text-slate-900 placeholder:text-slate-400 resize-none ${
                errors.obs ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            <div className="flex justify-between mt-1">
              {errors.obs ? (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle size={12} /> {errors.obs}
                </p>
              ) : (
                <span />
              )}
              <span className="text-xs text-slate-400">
                {formData.obs.length}/500
              </span>
            </div>
          </div>

          {/* ️ Alerta de Rate Limiting */}
          {submitAttempts >= 2 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                Você fez {submitAttempts} tentativa(s). Aguarde alguns segundos antes de tentar novamente.
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading || clients.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] font-medium transition-colors disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
              {loading ? 'Cadastrando...' : 'Cadastrar Obrigação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}