'use client';

// =================================================================
// INÍCIO: frontend/src/components/clients/ClientProfileModal.tsx
// =================================================================
/**
 * 🆕 Sprint F12.4 — Ficha COMPLETA do Cliente
 * -----------------------------------------------------------------
 * Exibe TUDO que o import S3D gravou:
 *   • Identificação (fantasia, regime, NIRE, inscrições, grupo...)
 *   • Endereço completo
 *   • Datas do relacionamento (desde/até, cadastro, abertura)
 *   • Contatos (1-N) com departamentos e flag de primário
 *   • Time interno por departamento (responsáveis do escritório)
 *   • Tags + observações
 * Regra da casa: somente leitura aqui; edição continua no wizard.
 */
import { X, Edit2, MapPin, Users, UserCog, Tags, Building2, CalendarDays } from 'lucide-react';

// ---------------------------- Tipos ----------------------------
export interface ProfileContact {
  id: string;
  name: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  departments?: string[];
  isPrimary?: boolean;
}

export interface ProfileOwner {
  id: string;
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
  // 🆕 Campos S3D (todos opcionais p/ clientes antigos)
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
  onEdit?: () => void;
}

// ---------------------------- Helpers ----------------------------
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '—';

const fmtCep = (cep?: string | null) => {
  const c = (cep || '').replace(/\D/g, '');
  return c.length === 8 ? `${c.slice(0, 5)}-${c.slice(5)}` : cep || '—';
};

const fmtBRL = (v: number) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Linha de campo padrão (label + valor ou traço) */
function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm text-slate-800 break-words">{value || '—'}</p>
    </div>
  );
}

/** Cartão de seção com título e ícone */
function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
        <Icon className="h-4 w-4 text-teal-600" /> {title}
      </h4>
      {children}
    </div>
  );
}

// =================================================================
// COMPONENTE
// =================================================================
export default function ClientProfileModal({ client, onClose, onEdit }: Props) {
  const c = client;
  const fullAddress = [
    c.address,
    c.addressNumber && `nº ${c.addressNumber}`,
    c.addressComplement,
    c.addressDistrict,
    c.addressCity,
    c.addressState,
  ]
    .filter(Boolean)
    .join(', ');

const hasS3d = Boolean(c.tradeName || c.taxRegime || c.address || (c as any).s3dId);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">
        {/* ---------------- Cabeçalho ---------------- */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 flex-wrap">
              <Building2 className="h-6 w-6 text-teal-600" />
              {c.companyName}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  c.status === 'ATIVO'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {c.status}
              </span>
              {c.taxRegime && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  {c.taxRegime}
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              CNPJ: {c.cnpj || '—'} • Honorário: {fmtBRL(c.monthlyFee)}/mês
              {c.accountingPlan && <> • 📒 {c.accountingPlan}</>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-teal-700 border border-teal-300 rounded-lg hover:bg-teal-50"
              >
                <Edit2 className="h-4 w-4" /> Editar
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* ---------------- Corpo rolável ---------------- */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!hasS3d && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Este cliente ainda não possui o cadastro completo do S3D.
              Use <strong>Importar S3D (completo)</strong> na carteira para enriquecer.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ---------- Identificação ---------- */}
            <Section icon={Building2} title="Identificação">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome fantasia" value={c.tradeName} />
                <Field label="Apelido e-contínuo" value={c.s3dNickname} />
                <Field label="NIRE" value={c.nire} />
                <Field label="Grupo de empresas" value={c.companyGroup} />
                <Field label="Insc. Municipal" value={c.municipalRegistration} />
                <Field label="Dt. Insc. Municipal" value={fmtDate(c.municipalRegistrationDate)} />
                <div className="col-span-2">
                  <Field
                    label="Inscrições Estaduais"
                    value={(c.stateRegistrations || []).join(' | ') || null}
                  />
                </div>
                <Field label="Empresa isenta?" value={c.isStateExempt ? 'Sim' : 'Não'} />
                <Field label="Outros identificadores" value={c.otherIdentifiers} />
                <div className="col-span-2">
                  <Field label="Website" value={c.website} />
                </div>
              </div>
            </Section>

            {/* ---------- Endereço ---------- */}
            <Section icon={MapPin} title="Endereço">
              <div className="space-y-3">
                <Field label="Logradouro completo" value={fullAddress || null} />
                <div className="grid grid-cols-3 gap-3">
                  <Field label="CEP" value={fmtCep(c.addressZip)} />
                  <Field label="Cidade" value={c.addressCity} />
                  <Field label="UF" value={c.addressState} />
                </div>
                <Field label="Telefone da empresa" value={c.phone} />
              </div>
            </Section>

            {/* ---------- Datas do relacionamento ---------- */}
            <Section icon={CalendarDays} title="Relacionamento">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cliente desde" value={fmtDate(c.clientSince)} />
                <Field label="Cliente até" value={fmtDate(c.clientUntil)} />
                <Field label="Cadastro no S3D" value={fmtDate(c.s3dRegistrationDate)} />
                <Field label="Abertura da empresa" value={fmtDate(c.foundationDate)} />
              </div>
            </Section>

            {/* ---------- Tags + observações ---------- */}
            <Section icon={Tags} title="Tags e observações">
              <div className="space-y-3">
                {(c.tags || []).length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {(c.tags || []).map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Sem tags.</p>
                )}
                <Field label="Observações internas" value={c.observations} />
              </div>
            </Section>
          </div>

          {/* ---------- Contatos (1-N) ---------- */}
          <Section icon={Users} title={`Contatos do cliente (${(c.contacts || []).length})`}>
            {(c.contacts || []).length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum contato importado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="py-2 px-3 font-medium">Nome</th>
                      <th className="py-2 px-3 font-medium">Cargo</th>
                      <th className="py-2 px-3 font-medium">Telefone</th>
                      <th className="py-2 px-3 font-medium">E-mail</th>
                      <th className="py-2 px-3 font-medium">Departamentos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(c.contacts || []).map((k) => (
                      <tr key={k.id} className="border-t border-slate-100">
                        <td className="py-1.5 px-3 font-semibold text-slate-800">
                          {k.name}
                          {k.isPrimary && (
                            <span className="ml-1 px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 text-[9px] font-bold">
                              PRIMÁRIO
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-3 text-slate-600">{k.role || '—'}</td>
                        <td className="py-1.5 px-3 text-slate-600">{k.phone || '—'}</td>
                        <td className="py-1.5 px-3 text-slate-600">{k.email || '—'}</td>
                        <td className="py-1.5 px-3 text-slate-500 max-w-[220px] truncate">
                          {(k.departments || []).join(', ') || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* ---------- Time interno por departamento ---------- */}
          <Section
            icon={UserCog}
            title={`Time interno por departamento (${(c.departmentOwners || []).length})`}
          >
            {(c.departmentOwners || []).length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum responsável importado.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(c.departmentOwners || []).map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <span className="text-xs text-slate-500 truncate">{o.department}</span>
                    <span className="text-xs font-bold text-slate-800 ml-2 truncate">
                      {o.ownerName}
                    </span>
                  </div>
                ))}
              </div>
            )}
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