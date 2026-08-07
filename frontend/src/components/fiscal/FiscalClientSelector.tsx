'use client';

import { useState, useEffect, useMemo } from 'react';
import { Building2, ChevronDown, Search, X } from 'lucide-react';
import api from '@/lib/axios';
import { useFiscalClientStore } from '@/store/fiscalClientStore';

/**
 * =================================================================
 * 🏢 FiscalClientSelector — Seletor de Cliente do Módulo Fiscal
 * =================================================================
 * Dropdown reutilizável que permite ao usuário filtrar os dados
 * fiscais por um cliente específico do escritório.
 * 
 * 🎯 Comportamento:
 *   - Carrega a lista de clientes do escritório ao montar (GET /clients)
 *   - Oferece opção "Todos os clientes" como padrão (dados legados)
 *   - Persiste a seleção em localStorage via Zustand
 *   - Busca em tempo real dentro do dropdown (UX premium)
 * 
 * 🛡️ Robustez:
 *   - Não quebra se a API de clientes falhar (silencioso)
 *   - Mostra estado de loading durante carregamento
 *   - Mostra estado vazio se não houver clientes cadastrados
 * 
 * 💡 Uso:
 *   <FiscalClientSelector />  // basta colocar no topo da página
 * 
 *   const { selected } = useFiscalClientStore();
 *   // selected.id é enviado como clientId nas chamadas de API
 * =================================================================
 */

interface ClientOption {
  id: string;
  companyName: string;
  cnpj: string | null;
}

export default function FiscalClientSelector() {
  const { selected, setSelected } = useFiscalClientStore();
  const [isOpen, setIsOpen] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // ---------------------------------------------------------------
  // 📥 Carrega lista de clientes do escritório
  // ---------------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/clients', { params: { limit: 500 } });
        // Suporta tanto { data: [...] } quanto array direto
        const list: ClientOption[] = Array.isArray(data)
          ? data
          : data?.data || data?.clients || [];
        setClients(list);
      } catch {
        // Silencioso — se falhar, o dropdown fica vazio
        setClients([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ---------------------------------------------------------------
  // 🔍 Filtragem em tempo real (busca por nome/CNPJ)
  // ---------------------------------------------------------------
  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const term = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.companyName.toLowerCase().includes(term) ||
        c.cnpj?.includes(term),
    );
  }, [clients, search]);

  // ---------------------------------------------------------------
  // 🎨 Seleção visual
  // ---------------------------------------------------------------
  const displayLabel = selected.id ? selected.name : 'Todos os clientes';

  const handleSelect = (client: ClientOption | null) => {
    setSelected(
      client ? { id: client.id, name: client.companyName } : null,
    );
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-slate-500 mb-1">
        Cliente
      </label>
      
      {/* Botão de abertura */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full md:w-72 flex items-center justify-between gap-2 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
          <span className="truncate font-medium text-slate-800">
            {displayLabel}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setSearch('');
            }}
          />
          
          <div className="absolute z-50 mt-1 w-full md:w-80 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            {/* Campo de busca */}
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar cliente..."
                  autoFocus
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Lista de opções */}
            <div className="max-h-72 overflow-y-auto">
              {/* Opção "Todos os clientes" */}
              <button
                onClick={() => handleSelect(null)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-teal-50 transition-colors flex items-center justify-between ${
                  !selected.id ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-700'
                }`}
              >
                <span>Todos os clientes</span>
                {!selected.id && <span className="text-xs">✓</span>}
              </button>

              {/* Estado: carregando */}
              {loading && (
                <div className="px-3 py-4 text-center text-xs text-slate-400">
                  Carregando clientes...
                </div>
              )}

              {/* Estado: vazio */}
              {!loading && clients.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-slate-400">
                  Nenhum cliente cadastrado
                </div>
              )}

              {/* Lista filtrada */}
              {!loading &&
                filteredClients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-teal-50 transition-colors border-t border-slate-100 flex items-center justify-between ${
                      selected.id === c.id
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{c.companyName}</p>
                      {c.cnpj && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {c.cnpj}
                        </p>
                      )}
                    </div>
                    {selected.id === c.id && (
                      <span className="text-xs ml-2">✓</span>
                    )}
                  </button>
                ))}

              {/* Nenhum resultado da busca */}
              {!loading && filteredClients.length === 0 && search && (
                <div className="px-3 py-4 text-center text-xs text-slate-400">
                  Nenhum cliente encontrado
                </div>
              )}
            </div>

            {/* Botão limpar seleção */}
            {selected.id && (
              <div className="border-t border-slate-100 p-2">
                <button
                  onClick={() => handleSelect(null)}
                  className="w-full flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-red-600 py-1.5 rounded transition-colors"
                >
                  <X className="h-3 w-3" />
                  Limpar seleção
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}