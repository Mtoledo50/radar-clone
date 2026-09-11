'use client';

// =================================================================
// INÍCIO: frontend/src/components/clients/ClientProfileModal.tsx
// =================================================================
/**
 * 🆕 Sprint F12.5 — Ficha Completa COM MODO EDIÇÃO
 * -----------------------------------------------------------------
 * • Botão "Editar cadastro": todos os campos viram inputs.
 * • Contatos: editar, adicionar, remover, definir primário.
 * • Responsáveis por depto: editar, adicionar, remover.
 * • Salvar → PUT /clients/:id/profile (transação no backend).
 * • "Editar contrato" continua abrindo o wizard antigo (planos/serviços).
 */
import { useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  X, Edit2, Save, MapPin, Users, UserCog, Tags, Building2,
  CalendarDays, Plus, Trash2, Loader2, FileText,
} from 'lucide-react';

// ---------------------------- Tipos ----------------------------
export interface ProfileContact {
  id?: string;
  name: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  departments?: string[];
  isPrimary?: boolean;
}
export interface ProfileOwner {
  id?: string;
  department: string;
  ownerName: string;
}
export interface ProfileClient {
  id: string;
  companyName: string;
  cnpj?: string | null;
  status: string;
  monthlyFee: number;
  accountingPlan?: string | null;
  tradeName?: string | null;
  taxRegime?: string | null;
  nire?: string | null;
  municipalRegistration?: string | null;
  municipalRegistrationDate?: string | null;
  stateRegistrations?: string[];
  isStateExempt?: boolean;
  otherIdentifiers?: string | null;
  phone?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  addressDistrict?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZip?: string | null;
  website?: string | null;
  s3dNickname?: string | null;
  companyGroup?: string | null;
  foundationDate?: string | null;
  clientSince?: string | null;
  clientUntil?: string | null;
  s3dRegistrationDate?: string | null;
  tags?: string[];
  observations?: string | null;
  contacts?: ProfileContact[];
  departmentOwners?: ProfileOwner[];
}

interface Props {
  client: ProfileClient;
  onClose: () => void;
  onEditContract?: () => void;
  onSaved?: (updated: ProfileClient) => void;
}

// ---------------------------- Helpers ----------------------------
const inp =
  'w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white';

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '—';
const fmtCep = (cep?: string | null) => {
  const c = (cep || '').replace(/\D/g, '');
  return c.length === 8 ? `${c.slice(0, 5)}-${c.slice(5)}` : cep || '—';
};
const fmtBRL = (v: number) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const REGIMES = [
  'SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL', 'MEI', 'DOMESTICAS_CEI', 'OUTROS',
];

// ---------------------------- Sub-componentes ----------------------------
function Section({ icon: Icon, title, children }: any) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
        <Icon className="h-4 w-4 text-teal-600" /> {title}
      </h4>
      {children}
    </div>
  );
}

/** Campo texto: view = parágrafo | edit = input */
function Txt({ label, editing, value, onChange, area, span2 }: any) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      {editing ? (
        area ? (
          <textarea rows={2} className={inp} value={value || ''} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input className={inp} value={value || ''} onChange={(e) => onChange(e.target.value)} />
        )
      ) : (
        <p className="text-sm text-slate-800 break-words">{value || '—'}</p>
      )}
    </div>
  );
}

/** Campo data: view = dd/mm/aaaa | edit = input date */
function Dte({ label, editing, value, onChange }: any) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      {editing ? (
        <input
          type="date"
          className={inp}
          value={value ? String(value).slice(0, 10) : ''}
          onChange={(e) =>
            onChange(e.target.value ? new Date(e.target.value + 'T12:00:00').toISOString() : null)
          }
        />
      ) : (
        <p className="text-sm text-slate-800">{fmtDate(value)}</p>
      )}
    </div>
  );
}

// =================================================================
// COMPONENTE PRINCIPAL
// =================================================================
export default function ClientProfileModal({ client, onClose, onEditContract, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<ProfileClient>(client);
  const [tagsStr, setTagsStr] = useState('');
  const [regsStr, setRegsStr] = useState('');

  const set = (patch: Partial<ProfileClient>) => setDraft((d) => ({ ...d, ...patch }));

  const startEdit = () => {
    setDraft(JSON.parse(JSON.stringify(client)));
    setTagsStr((client.tags || []).join(', '));
    setRegsStr((client.stateRegistrations || []).join(', '));
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    setDraft(client);
  };

  const save = async () => {
    const contacts = (draft.contacts || [])
      .filter((k) => (k.name || '').trim())
      .map((k, i, arr) => ({
        name: k.name.trim(),
        role: k.role || null,
        phone: k.phone || null,
        email: k.email || null,
        departments: k.departments || [],
        isPrimary: arr.some((x) => x.isPrimary) ? !!k.isPrimary : i === 0,
      }));
    const owners = (draft.departmentOwners || [])
      .filter((o) => (o.department || '').trim() && (o.ownerName || '').trim())
      .map((o) => ({ department: o.department.trim(), ownerName: o.ownerName.trim() }));

    setSaving(true);
    try {
      const { data } = await api.put(`/clients/${client.id}/profile`, {
        tradeName: draft.tradeName || null,
        taxRegime: draft.taxRegime || null,
        nire: draft.nire || null,
        municipalRegistration: draft.municipalRegistration || null,
        municipalRegistrationDate: draft.municipalRegistrationDate || null,
        stateRegistrations: regsStr.split(/[,;]/).map((s) => s.trim()).filter(Boolean),
        isStateExempt: !!draft.isStateExempt,
        otherIdentifiers: draft.otherIdentifiers || null,
        phone: draft.phone || null,
        address: draft.address || null,
        addressNumber: draft.addressNumber || null,
        addressComplement: draft.addressComplement || null,
        addressDistrict: draft.addressDistrict || null,
        addressCity: draft.addressCity || null,
        addressState: draft.addressState || null,
        addressZip: draft.addressZip || null,
        website: draft.website || null,
        s3dNickname: draft.s3dNickname || null,
        companyGroup: draft.companyGroup || null,
        foundationDate: draft.foundationDate || null,
        clientSince: draft.clientSince || null,
        clientUntil: draft.clientUntil || null,
        s3dRegistrationDate: draft.s3dRegistrationDate || null,
        tags: tagsStr.split(',').map((t) => t.trim()).filter(Boolean),
        observations: draft.observations || null,
        contacts,
        departmentOwners: owners,
      });
      toast.success('Cadastro atualizado com sucesso!');
      setDraft(data);
      setEditing(false);
      onSaved?.(data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao salvar o cadastro.');
    } finally {
      setSaving(false);
    }
  };

  const c = draft;
  const fullAddress = [
    c.address, c.addressNumber && `nº ${c.addressNumber}`, c.addressComplement,
    c.addressDistrict, c.addressCity, c.addressState,
  ].filter(Boolean).join(', ');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">
        {/* ---------------- Cabeçalho ---------------- */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 flex-wrap">
              <Building2 className="h-6 w-6 text-teal-600" />
              {client.companyName}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${client.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                {client.status}
              </span>
              {c.taxRegime && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  {c.taxRegime}
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              CNPJ: {client.cnpj || '—'} • Honorário: {fmtBRL(client.monthlyFee)}/mês
              {client.accountingPlan && <> • 📒 {client.accountingPlan}</>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button onClick={cancelEdit} className="px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg hover:bg-slate-50">
                  Cancelar
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={startEdit}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-teal-700 border border-teal-300 rounded-lg hover:bg-teal-50"
                >
                  <Edit2 className="h-4 w-4" /> Editar cadastro
                </button>
                {onEditContract && (
                  <button
                    onClick={onEditContract}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    <FileText className="h-4 w-4" /> Editar contrato
                  </button>
                )}
              </>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* ---------------- Corpo ---------------- */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {editing && (
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">
              <strong>Modo edição ativo:</strong> todos os campos abaixo podem ser alterados.
              Contatos e responsáveis podem ser adicionados/removidos.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ---------- Identificação ---------- */}
            <Section icon={Building2} title="Identificação">
              <div className="grid grid-cols-2 gap-3">
                <Txt label="Nome fantasia" editing={editing} value={c.tradeName} onChange={(v: string) => set({ tradeName: v })} />
                <Txt label="Apelido e-contínuo" editing={editing} value={c.s3dNickname} onChange={(v: string) => set({ s3dNickname: v })} />
                <Txt label="NIRE" editing={editing} value={c.nire} onChange={(v: string) => set({ nire: v })} />
                <Txt label="Grupo de empresas" editing={editing} value={c.companyGroup} onChange={(v: string) => set({ companyGroup: v })} />
                <Txt label="Insc. Municipal" editing={editing} value={c.municipalRegistration} onChange={(v: string) => set({ municipalRegistration: v })} />
                <Dte label="Dt. Insc. Municipal" editing={editing} value={c.municipalRegistrationDate} onChange={(v: string | null) => set({ municipalRegistrationDate: v })} />
                <Txt span2 label="Inscrições Estaduais (separe por vírgula)" editing={editing}
                  value={editing ? regsStr : (c.stateRegistrations || []).join(' | ')}
                  onChange={(v: string) => setRegsStr(v)} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Empresa isenta?</p>
                  {editing ? (
                    <select className={inp} value={c.isStateExempt ? '1' : '0'}
                      onChange={(e) => set({ isStateExempt: e.target.value === '1' })}>
                      <option value="0">Não</option>
                      <option value="1">Sim</option>
                    </select>
                  ) : (
                    <p className="text-sm text-slate-800">{c.isStateExempt ? 'Sim' : 'Não'}</p>
                  )}
                </div>
                <Txt label="Outros identificadores" editing={editing} value={c.otherIdentifiers} onChange={(v: string) => set({ otherIdentifiers: v })} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Regime tributário</p>
                  {editing ? (
                    <select className={inp} value={c.taxRegime || ''} onChange={(e) => set({ taxRegime: e.target.value || null })}>
                      <option value="">—</option>
                      {REGIMES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <p className="text-sm text-slate-800">{c.taxRegime || '—'}</p>
                  )}
                </div>
                <Txt label="Website" editing={editing} value={c.website} onChange={(v: string) => set({ website: v })} />
              </div>
            </Section>

            {/* ---------- Endereço ---------- */}
            <Section icon={MapPin} title="Endereço">
              <div className="space-y-3">
                <Txt span2 label="Logradouro" editing={editing} value={c.address} onChange={(v: string) => set({ address: v })} />
                <div className="grid grid-cols-3 gap-3">
                  <Txt label="Número" editing={editing} value={c.addressNumber} onChange={(v: string) => set({ addressNumber: v })} />
                  <Txt label="Complemento" editing={editing} value={c.addressComplement} onChange={(v: string) => set({ addressComplement: v })} />
                  <Txt label="CEP" editing={editing} value={c.addressZip} onChange={(v: string) => set({ addressZip: v })} />
                  <Txt label="Bairro" editing={editing} value={c.addressDistrict} onChange={(v: string) => set({ addressDistrict: v })} />
                  <Txt label="Cidade" editing={editing} value={c.addressCity} onChange={(v: string) => set({ addressCity: v })} />
                  <Txt label="UF" editing={editing} value={c.addressState} onChange={(v: string) => set({ addressState: v })} />
                </div>
                {!editing && <p className="text-xs text-slate-500">{fullAddress || '—'}</p>}
                <Txt label="Telefone da empresa" editing={editing} value={c.phone} onChange={(v: string) => set({ phone: v })} />
              </div>
            </Section>

            {/* ---------- Relacionamento ---------- */}
            <Section icon={CalendarDays} title="Relacionamento">
              <div className="grid grid-cols-2 gap-3">
                <Dte label="Cliente desde" editing={editing} value={c.clientSince} onChange={(v: string | null) => set({ clientSince: v })} />
                <Dte label="Cliente até" editing={editing} value={c.clientUntil} onChange={(v: string | null) => set({ clientUntil: v })} />
                <Dte label="Cadastro no S3D" editing={editing} value={c.s3dRegistrationDate} onChange={(v: string | null) => set({ s3dRegistrationDate: v })} />
                <Dte label="Abertura da empresa" editing={editing} value={c.foundationDate} onChange={(v: string | null) => set({ foundationDate: v })} />
              </div>
            </Section>

            {/* ---------- Tags + observações ---------- */}
            <Section icon={Tags} title="Tags e observações">
              <div className="space-y-3">
                {editing ? (
                  <Txt span2 label="Tags (separe por vírgula)" editing={editing} value={tagsStr} onChange={(v: string) => setTagsStr(v)} />
                ) : (
                  (c.tags || []).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {(c.tags || []).map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">{t}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Sem tags.</p>
                  )
                )}
                <Txt span2 area label="Observações internas" editing={editing} value={c.observations} onChange={(v: string) => set({ observations: v })} />
              </div>
            </Section>
          </div>

          {/* ---------- Contatos ---------- */}
          <Section icon={Users} title={`Contatos do cliente (${(c.contacts || []).length})`}>
            {!editing && (c.contacts || []).length === 0 && (
              <p className="text-sm text-slate-400">Nenhum contato importado.</p>
            )}
            {editing && (
              <button
                onClick={() => set({ contacts: [...(c.contacts || []), { name: '', role: null, phone: null, email: null, departments: [], isPrimary: (c.contacts || []).length === 0 }] })}
                className="mb-2 flex items-center gap-1 px-2 py-1 text-xs font-semibold text-teal-700 border border-teal-300 rounded-lg hover:bg-teal-50"
              >
                <Plus className="h-3 w-3" /> Adicionar contato
              </button>
            )}
            {(c.contacts || []).length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="py-2 px-2 font-medium">Primário</th>
                      <th className="py-2 px-2 font-medium">Nome</th>
                      <th className="py-2 px-2 font-medium">Cargo</th>
                      <th className="py-2 px-2 font-medium">Telefone</th>
                      <th className="py-2 px-2 font-medium">E-mail</th>
                      <th className="py-2 px-2 font-medium">Departamentos (vírgula)</th>
                      {editing && <th className="py-2 px-2" />}
                    </tr>
                  </thead>
                  <tbody>
                    {(c.contacts || []).map((k, i) => (
                      <tr key={k.id || i} className="border-t border-slate-100">
                        <td className="py-1.5 px-2">
                          <input
                            type="radio"
                            name="primary-contact"
                            checked={!!k.isPrimary}
                            disabled={!editing}
                            onChange={() =>
                              set({ contacts: (c.contacts || []).map((x, xi) => ({ ...x, isPrimary: xi === i })) })
                            }
                          />
                        </td>
                        {editing ? (
                          <>
                            <td className="py-1.5 px-2"><input className={inp} value={k.name || ''} onChange={(e) => set({ contacts: (c.contacts || []).map((x, xi) => xi === i ? { ...x, name: e.target.value } : x) })} /></td>
                            <td className="py-1.5 px-2"><input className={inp} value={k.role || ''} onChange={(e) => set({ contacts: (c.contacts || []).map((x, xi) => xi === i ? { ...x, role: e.target.value } : x) })} /></td>
                            <td className="py-1.5 px-2"><input className={inp} value={k.phone || ''} onChange={(e) => set({ contacts: (c.contacts || []).map((x, xi) => xi === i ? { ...x, phone: e.target.value } : x) })} /></td>
                            <td className="py-1.5 px-2"><input className={inp} value={k.email || ''} onChange={(e) => set({ contacts: (c.contacts || []).map((x, xi) => xi === i ? { ...x, email: e.target.value } : x) })} /></td>
                            <td className="py-1.5 px-2"><input className={inp} value={(k.departments || []).join(', ')} onChange={(e) => set({ contacts: (c.contacts || []).map((x, xi) => xi === i ? { ...x, departments: e.target.value.split(',').map((d) => d.trim()).filter(Boolean) } : x) })} /></td>
                            <td className="py-1.5 px-2">
                              <button onClick={() => set({ contacts: (c.contacts || []).filter((_, xi) => xi !== i) })} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-1.5 px-2 font-semibold text-slate-800">
                              {k.name}
                              {k.isPrimary && <span className="ml-1 px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 text-[9px] font-bold">PRIMÁRIO</span>}
                            </td>
                            <td className="py-1.5 px-2 text-slate-600">{k.role || '—'}</td>
                            <td className="py-1.5 px-2 text-slate-600">{k.phone || '—'}</td>
                            <td className="py-1.5 px-2 text-slate-600">{k.email || '—'}</td>
                            <td className="py-1.5 px-2 text-slate-500 max-w-[220px] truncate">{(k.departments || []).join(', ') || '—'}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* ---------- Time interno ---------- */}
          <Section icon={UserCog} title={`Time interno por departamento (${(c.departmentOwners || []).length})`}>
            {editing && (
              <button
                onClick={() => set({ departmentOwners: [...(c.departmentOwners || []), { department: '', ownerName: '' }] })}
                className="mb-2 flex items-center gap-1 px-2 py-1 text-xs font-semibold text-teal-700 border border-teal-300 rounded-lg hover:bg-teal-50"
              >
                <Plus className="h-3 w-3" /> Adicionar responsável
              </button>
            )}
            {(c.departmentOwners || []).length === 0 && !editing && (
              <p className="text-sm text-slate-400">Nenhum responsável importado.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {(c.departmentOwners || []).map((o, i) =>
                editing ? (
                  <div key={o.id || i} className="flex items-center gap-1">
                    <input className={inp} value={o.department} placeholder="Departamento"
                      onChange={(e) => set({ departmentOwners: (c.departmentOwners || []).map((x, xi) => xi === i ? { ...x, department: e.target.value } : x) })} />
                    <input className={inp} value={o.ownerName} placeholder="Responsável"
                      onChange={(e) => set({ departmentOwners: (c.departmentOwners || []).map((x, xi) => xi === i ? { ...x, ownerName: e.target.value } : x) })} />
                    <button onClick={() => set({ departmentOwners: (c.departmentOwners || []).filter((_, xi) => xi !== i) })} className="p-1 text-red-500 hover:bg-red-50 rounded shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div key={o.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="text-xs text-slate-500 truncate">{o.department}</span>
                    <span className="text-xs font-bold text-slate-800 ml-2 truncate">{o.ownerName}</span>
                  </div>
                ),
              )}
            </div>
          </Section>
        </div>

        {/* ---------------- Rodapé ---------------- */}
        <div className="p-4 border-t border-slate-200 bg-white rounded-b-2xl flex justify-end">
          <button onClick={onClose} className="px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
// =================================================================
// FIM: frontend/src/components/clients/ClientProfileModal.tsx
// =================================================================