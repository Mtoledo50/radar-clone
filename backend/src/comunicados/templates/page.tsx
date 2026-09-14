// ============================================================================
// SPRINT F16-A — Templates de Email (CRUD + preview ao vivo)
// ----------------------------------------------------------------------------
// Funcionalidades:
//   - Lista templates por tipo de documento (DAS, DARF, FGTS...)
//   - Editor com assunto + corpo HTML + preview ao vivo (substituicao demo)
//   - Toggle ativo/inativo
//   - Criar / salvar / excluir
// ============================================================================
'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

import { useEffect, useState } from 'react';

// Tipos de documento disponiveis (espelham o enum TipoDocumentoComunicado)
const TIPOS = [
  'DAS', 'DARF', 'ISS', 'FGTS', 'IRPF', 'BALANCETE', 'DRE',
  'INFORME_RENDIMENTO', 'E_SOCIAL', 'SPED', 'GENERICO',
] as const;

interface EmailTemplate {
  id: string;
  tipoDocumento: string;
  assunto: string;
  corpoHtml: string;
  ativo: boolean;
}

// ----------------------------------------------------------------------------
// Preview local: substitui {{variaveis}} por valores de demonstracao
// (o render oficial Handlebars acontece no backend no momento do envio)
// ----------------------------------------------------------------------------
function renderDemo(tpl: string): string {
  const map: Record<string, string> = {
    '{{cliente.nome}}': 'FERNANDA LOPES TOLEDO (DEMO)',
    '{{cliente.cnpj}}': '08.432.644/0001-60',
    '{{cliente.id}}': 'demo-cliente',
    '{{documento.tipo}}': 'DAS',
    '{{documento.competencia}}': '2026-01',
    '{{documento.nome}}': 'DAS_08432644000160_JAN2026.pdf',
    '{{documento.tamanhoBytes}}': '26',
    '{{link.download}}': 'https://radar-api.contacerta.com.br/track/download/demo',
    '{{link.expiraEm}}': '21/09/2026',
    '{{empresa.nome}}': 'Conta Certa Demo',
    '{{empresa.id}}': 'demo-empresa',
    '{{setor.nome}}': 'Fiscal',
  };
  let out = tpl;
  for (const [k, v] of Object.entries(map)) out = out.split(k).join(v);
  return out;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<EmailTemplate | 'novo' | null>(null);

  // Formulario do editor
  const [formTipo, setFormTipo] = useState<string>('DAS');
  const [formAssunto, setFormAssunto] = useState('');
  const [formCorpo, setFormCorpo] = useState('');
  const [formAtivo, setFormAtivo] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    try {
      const res = await fetch(`${API_URL}/api/email-templates`);
      const data = await res.json();
      setTemplates(data.data || []);
    } catch (e) {
      console.error('Erro ao carregar templates:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  // Abre o editor (novo ou existente)
  const abrirEditor = (tpl: EmailTemplate | 'novo') => {
    setEditando(tpl);
    if (tpl === 'novo') {
      setFormTipo('DAS');
      setFormAssunto('Documento {{documento.tipo}} {{documento.competencia}} — {{cliente.nome}}');
      setFormCorpo('<p>Olá, {{cliente.nome}}!</p><p>Segue em anexo o documento {{documento.tipo}} da competência {{documento.competencia}}.</p><p><a href="{{link.download}}">Baixar documento</a> (válido até {{link.expiraEm}})</p>');
      setFormAtivo(true);
    } else {
      setFormTipo(tpl.tipoDocumento);
      setFormAssunto(tpl.assunto);
      setFormCorpo(tpl.corpoHtml);
      setFormAtivo(tpl.ativo);
    }
  };

  // Salva (cria ou atualiza)
  const salvar = async () => {
    setSalvando(true);
    try {
      const isNovo = editando === 'novo';
      const res = await fetch(
        isNovo
          ? `${API_URL}/api/email-templates`
          : `${API_URL}/api/email-templates/${(editando as EmailTemplate).id}`,
        {
          method: isNovo ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipoDocumento: formTipo,
            assunto: formAssunto,
            corpoHtml: formCorpo,
            ativo: formAtivo,
          }),
        },
      );
      if (res.ok) {
        alert('Template salvo com sucesso!');
        setEditando(null);
        carregar();
      } else {
        alert('Erro ao salvar template.');
      }
    } catch {
      alert('Erro de conexão.');
    } finally {
      setSalvando(false);
    }
  };

  // Toggle ativo/inativo
  const toggleAtivo = async (tpl: EmailTemplate) => {
    await fetch(`${API_URL}/api/email-templates/${tpl.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !tpl.ativo }),
    });
    carregar();
  };

  // Excluir
  const excluir = async (tpl: EmailTemplate) => {
    if (!confirm(`Excluir o template ${tpl.tipoDocumento}?`)) return;
    await fetch(`${API_URL}/api/email-templates/${tpl.id}`, { method: 'DELETE' });
    carregar();
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Templates de Email</h1>
          <p className="text-slate-600 mt-2">
            Modele os emails enviados por tipo de documento. Variáveis disponíveis:
            {' '}<code className="bg-slate-100 px-1 rounded text-xs">{'{{cliente.nome}}'}</code>{' '}
            <code className="bg-slate-100 px-1 rounded text-xs">{'{{documento.competencia}}'}</code>{' '}
            <code className="bg-slate-100 px-1 rounded text-xs">{'{{link.download}}'}</code>
          </p>
        </div>
        <button
          onClick={() => abrirEditor('novo')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          + Novo Template
        </button>
      </div>

      {/* LISTA */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className={`bg-white border rounded-lg p-5 shadow-sm ${
                tpl.ativo ? 'border-slate-200' : 'border-slate-100 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800">
                  {tpl.tipoDocumento}
                </span>
                <button
                  onClick={() => toggleAtivo(tpl)}
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    tpl.ativo
                      ? 'bg-green-100 text-green-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                  title="Clique para alternar"
                >
                  {tpl.ativo ? 'ATIVO' : 'INATIVO'}
                </button>
              </div>
              <p className="font-medium text-slate-900 text-sm mb-3 truncate">
                {tpl.assunto}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => abrirEditor(tpl)}
                  className="flex-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200"
                >
                  Editar
                </button>
                <button
                  onClick={() => excluir(tpl)}
                  className="px-3 py-1.5 bg-red-50 text-red-700 rounded text-sm hover:bg-red-100"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL EDITOR */}
      {editando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">
                {editando === 'novo' ? 'Novo Template' : 'Editar Template'}
              </h2>
              <button
                onClick={() => setEditando(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* COLUNA ESQUERDA: FORMULARIO */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tipo de Documento
                  </label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    {TIPOS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Assunto (aceita variáveis)
                  </label>
                  <input
                    value={formAssunto}
                    onChange={(e) => setFormAssunto(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Corpo HTML (aceita variáveis)
                  </label>
                  <textarea
                    value={formCorpo}
                    onChange={(e) => setFormCorpo(e.target.value)}
                    rows={14}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={formAtivo}
                    onChange={(e) => setFormAtivo(e.target.checked)}
                  />
                  Template ativo (usado nos envios)
                </label>
              </div>

              {/* COLUNA DIREITA: PREVIEW AO VIVO */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">
                  Preview ao vivo (dados de demonstração)
                </p>
                <div className="border border-slate-200 rounded-lg bg-slate-50 p-2 mb-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {renderDemo(formAssunto)}
                  </p>
                </div>
                <iframe
                  srcDoc={renderDemo(formCorpo)}
                  className="w-full h-[380px] bg-white border border-slate-200 rounded-lg"
                  title="Preview do template"
                  sandbox=""
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setEditando(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : 'Salvar Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}