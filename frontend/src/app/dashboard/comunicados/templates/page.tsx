// ============================================================================
// SPRINT F16-A — Templates de Email (edição com preview visual)
// ----------------------------------------------------------------------------
// FINALIDADE DA TELA:
//   Central de redação dos emails. O texto (assunto + corpo) fica no BANCO,
//   não no código. Editar aqui = mudar o texto de todos os próximos envios
//   daquele tipo de documento, sem deploy.
//
// MODO LEITURA (🆕 melhorado):
//   Mostra o email RENDERIZADO com dados de demonstração (como o cliente vê)
//   + botão opcional "Ver código-fonte" para quem quiser ver o HTML cru.
//
// MODO EDIÇÃO:
//   Esquerda: editores de assunto + corpo HTML (aceitam {{variaveis}})
//   Direita:  preview ao vivo renderizado com dados demo
// ============================================================================
'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

import { useEffect, useState } from 'react';

interface EmailTemplate {
  id: string;
  nome: string;
  tipoDocumento: string;
  assunto: string;
  corpoHtml: string;
  ativo: boolean;
}

// Dados de demonstração usados no preview (substituem as {{variaveis}})
const DADOS_DEMO = {
  cliente: {
    nome: 'FERNANDA LOPES TOLEDO',
    cnpj: '08.432.644/0001-60',
    id: 'demo-cliente-id',
  },
  documento: {
    tipo: 'DAS',
    competencia: '2026-01',
    nome: 'DAS_08432644000160_JAN2026.pdf',
    tamanhoBytes: 123456,
  },
  link: {
    download: 'http://localhost:3001/track/download/demo-id/demo-token',
    expiraEm: '21/09/2026',
  },
  empresa: {
    nome: 'Conta Certa Demo',
    id: 'demo-company-id',
  },
  setor: {
    nome: 'Fiscal',
  },
};

// Renderização Handlebars simplificada no browser (só para preview)
function renderTemplate(template: string, data: any): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const keys = key.trim().split('.');
    let value = data;
    for (const k of keys) {
      value = value?.[k];
    }
    return value ?? match;
  });
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch(`${API_URL}/api/email-templates`);
        const data = await response.json();
        setTemplates(data.data || []);
      } catch (error) {
        console.error('Erro ao carregar templates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const salvar = async (id: string, assunto: string, corpoHtml: string) => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/email-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assunto, corpoHtml }),
      });

      if (response.ok) {
        alert('Template salvo! Os próximos envios usarão o texto novo.');
        setEditing(null);
        const res = await fetch(`${API_URL}/api/email-templates`);
        const data = await res.json();
        setTemplates(data.data || []);
      } else {
        alert('Erro ao salvar template.');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12 text-slate-500">Carregando templates...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">
          🎨 Templates de Email
        </h1>
        <p className="text-slate-600 mt-2">
          Edite o texto dos emails enviados por tipo de documento. O que você
          salvar aqui vira o texto padrão dos próximos envios — sem mexer em código.
        </p>
      </div>

      {/* LISTA */}
      <div className="space-y-6">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            editing={editing === template.id}
            onEdit={() => setEditing(template.id)}
            onCancel={() => setEditing(null)}
            onSave={salvar}
            saving={saving && editing === template.id}
          />
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// COMPONENTE: CARD DO TEMPLATE
// ----------------------------------------------------------------------------
function TemplateCard({
  template,
  editing,
  onEdit,
  onCancel,
  onSave,
  saving,
}: {
  template: EmailTemplate;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (id: string, assunto: string, corpoHtml: string) => void;
  saving: boolean;
}) {
  const [assunto, setAssunto] = useState(template.assunto);
  const [corpoHtml, setCorpoHtml] = useState(template.corpoHtml);
  const [mostrarCodigo, setMostrarCodigo] = useState(false);

  useEffect(() => {
    if (!editing) {
      setAssunto(template.assunto);
      setCorpoHtml(template.corpoHtml);
    }
  }, [editing, template.assunto, template.corpoHtml]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
      {/* HEADER DO CARD */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            {template.nome}
          </h3>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
              {template.tipoDocumento}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded font-medium ${
                template.ativo
                  ? 'bg-green-100 text-green-800'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {template.ativo ? 'EM USO' : 'INATIVO'}
            </span>
          </div>
        </div>
        {!editing ? (
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            ✏️ Editar texto
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave(template.id, assunto, corpoHtml)}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : '💾 Salvar'}
            </button>
          </div>
        )}
      </div>

      {/* ═════════════ MODO LEITURA (preview visual por padrão) ═════════════ */}
      {!editing && (
        <div>
          {/* Assunto renderizado */}
          <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded">
            <span className="text-xs font-medium text-slate-500 uppercase">
              Assunto (como o cliente vê):
            </span>
            <p className="text-slate-900 font-medium mt-1">
              {renderTemplate(template.assunto, DADOS_DEMO)}
            </p>
          </div>

          {/* Corpo renderizado */}
          <span className="text-xs font-medium text-slate-500 uppercase">
            Email (como o cliente vê):
          </span>
          <div
            className="mt-1 p-4 bg-white border border-slate-200 rounded"
            dangerouslySetInnerHTML={{
              __html: renderTemplate(template.corpoHtml, DADOS_DEMO),
            }}
          />

          {/* Toggle opcional para ver o código-fonte */}
          <button
            onClick={() => setMostrarCodigo(!mostrarCodigo)}
            className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            {mostrarCodigo ? '▲ Ocultar código-fonte' : '▼ Ver código-fonte'}
          </button>
          {mostrarCodigo && (
            <pre className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 overflow-x-auto">
              {template.corpoHtml}
            </pre>
          )}
        </div>
      )}

      {/* ═════════════ MODO EDIÇÃO (editores + preview ao vivo) ═════════════ */}
      {editing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ESQUERDA: editores */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assunto (aceita variáveis)
              </label>
              <input
                type="text"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Corpo do email (HTML + variáveis)
              </label>
              <textarea
                value={corpoHtml}
                onChange={(e) => setCorpoHtml(e.target.value)}
                rows={18}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              />
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <strong>Variáveis disponíveis:</strong>{' '}
              {'{{cliente.nome}} · {{cliente.cnpj}} · {{documento.tipo}} · '}
              {'{{documento.competencia}} · {{documento.nome}} · '}
              {'{{link.download}} · {{link.expiraEm}} · {{empresa.nome}} · {{setor.nome}}'}
            </div>
          </div>

          {/* DIREITA: preview ao vivo */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Preview do assunto (ao vivo)
              </label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <p className="text-slate-900 font-medium">
                  {renderTemplate(assunto, DADOS_DEMO)}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Preview do email (ao vivo)
              </label>
              <div
                className="p-4 bg-white border border-slate-200 rounded"
                dangerouslySetInnerHTML={{
                  __html: renderTemplate(corpoHtml, DADOS_DEMO),
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}