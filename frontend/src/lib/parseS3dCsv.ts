// =================================================================
// INÍCIO: frontend/src/lib/parseS3dCsv.ts
// =================================================================
/**
 * 🆕 Sprint F12 — Parser S3D v2 (header-driven, à prova de ordem)
 * -----------------------------------------------------------------
 * O CSV do S3D tem 44 colunas e 1 linha por CONTATO (empresa repete).
 * Este parser:
 *   1. Detecta separador e respeita aspas ("campo com ; dentro")
 *   2. Classifica colunas por SINÔNIMOS (não por posição)
 *   3. Colunas não reconhecidas = departamentos (valor = responsável)
 *   4. Agrupa linhas por CNPJ → 1 empresa com N contatos
 *   5. Ignora a linha-lixo "Filtros utilizados: ..."
 */

export interface S3dContact {
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  departments?: string[];
}

export interface S3dOwner {
  department: string;
  ownerName: string;
}

export interface S3dCompany {
  s3dId?: number;
  companyName: string;
  cnpj?: string;
  tradeName?: string;
  taxRegime?: string;
  nire?: string;
  municipalRegistration?: string;
  municipalRegistrationDate?: string;
  stateRegistrations?: string[];
  isStateExempt?: boolean;
  otherIdentifiers?: string;
  phone?: string;
  address?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressDistrict?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  website?: string;
  s3dNickname?: string;
  companyGroup?: string;
  foundationDate?: string;
  clientSince?: string;
  clientUntil?: string;
  s3dRegistrationDate?: string;
  monthlyFee?: number;
  active?: boolean;
  observations?: string;
  tags?: string[];
  contacts?: S3dContact[];
  owners?: S3dOwner[];
}

// ---------------------------- helpers ----------------------------
const norm = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const digits = (s: string) => (s || '').replace(/\D/g, '');

const brMoney = (s: string): number => {
  if (!s || !s.trim()) return 0;
  const negative = s.includes('-');
  let clean = s.replace(/[^\d.,]/g, '');
  if (!clean) return 0;
  const lastComma = clean.lastIndexOf(',');
  const lastDot = clean.lastIndexOf('.');
  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  } else if (lastComma >= 0) {
    const count = (clean.match(/,/g) || []).length;
    const after = clean.length - lastComma - 1;
    if (count > 1 || after === 3) clean = clean.replace(/,/g, '');
    else clean = clean.replace(',', '.');
  } else if (lastDot >= 0) {
    const count = (clean.match(/\./g) || []).length;
    if (count > 1) clean = clean.replace(/\./g, '');
  }
  const n = parseFloat(clean);
  if (isNaN(n)) return 0;
  return negative ? -Math.abs(n) : n;
};

const REGIME = (v: string): string | undefined => {
  const t = norm(v);
  if (!t) return undefined;
  if (t.includes('simples')) return 'SIMPLES_NACIONAL';
  if (t.includes('presumido')) return 'LUCRO_PRESUMIDO';
  if (t.includes('real')) return 'LUCRO_REAL';
  if (t.includes('mei')) return 'MEI';
  if (t.includes('domestic') || t.includes('cei')) return 'DOMESTICAS_CEI';
  return 'OUTROS';
};

const yes = (v: string) =>
  ['sim', 's', 'true', '1', 'ativo', 'ativa', 'atva'].includes(norm(v));

/** Classifica um cabeçalho normalizado → chave do S3dCompany | contato | depto */
function classifyHeader(h: string): {
  kind: 'field' | 'contact' | 'dept';
  key: string;
} {
  if (h.includes('razao') || h === 'nome_empresa') return { kind: 'field', key: 'companyName' };
  if (h === 'id' || h === 'id_s3d') return { kind: 'field', key: 's3dId' };
  if (h.includes('cnpj')) return { kind: 'field', key: 'cnpj' };
  if (h.includes('fantasia')) return { kind: 'field', key: 'tradeName' };
  if (h.includes('regime')) return { kind: 'field', key: 'taxRegime' };
  if (h.includes('nire')) return { kind: 'field', key: 'nire' };
  if (h.includes('grupo')) return { kind: 'field', key: 'companyGroup' };
  if (h.includes('apelido')) return { kind: 'field', key: 's3dNickname' };
  if (h.includes('cep')) return { kind: 'field', key: 'addressZip' };
  if (h.includes('endereco')) return { kind: 'field', key: 'address' };
  if (h === 'numero' || h.includes('n_mero')) return { kind: 'field', key: 'addressNumber' };
  if (h.includes('complemento')) return { kind: 'field', key: 'addressComplement' };
  if (h.includes('bairro')) return { kind: 'field', key: 'addressDistrict' };
  if (h.includes('cidade') || h.includes('municipio')) return { kind: 'field', key: 'addressCity' };
  if (h === 'uf' || h.includes('estado')) return { kind: 'field', key: 'addressState' };
  if (h.includes('insc_municipal') || h.includes('inscricao_municipal'))
    return { kind: 'field', key: 'municipalRegistration' };
  if (h.includes('dt_insc') || h.includes('data_insc'))
    return { kind: 'field', key: 'municipalRegistrationDate' };
  if (h.includes('inscricoes_estaduais') || h.includes('inscricao_estadual'))
    return { kind: 'field', key: 'stateRegistrations' };
  if (h.includes('isenta')) return { kind: 'field', key: 'isStateExempt' };
  if (h.includes('outros_ident')) return { kind: 'field', key: 'otherIdentifiers' };
  if (h === 'cadastro') return { kind: 'field', key: 's3dRegistrationDate' };
  if (h.includes('abertura')) return { kind: 'field', key: 'foundationDate' };
  if (h.includes('desde') || h === 'cli_desde') return { kind: 'field', key: 'clientSince' };
  if (h.includes('ate') || h === 'cli_ate') return { kind: 'field', key: 'clientUntil' };
  if (h.includes('ativa')) return { kind: 'field', key: 'active' };
  if (h.includes('honor')) return { kind: 'field', key: 'monthlyFee' };
  if (h.includes('website') || h.includes('site')) return { kind: 'field', key: 'website' };
  if (h.includes('coment') || h.includes('anotac')) return { kind: 'field', key: 'observations' };
  if (h === 'tags') return { kind: 'field', key: 'tags' };
  if (h.includes('fone_empresa') || (h.includes('fone') && !h.includes('contato')))
    return { kind: 'field', key: 'phone' };
  if (h.includes('nome_contato') || h.includes('nome_do_contato'))
    return { kind: 'contact', key: 'name' };
  if (h.includes('cargo')) return { kind: 'contact', key: 'role' };
  if (h.includes('departamento')) return { kind: 'contact', key: 'departments' };
  if (h.includes('email') || h.includes('e_mail')) return { kind: 'contact', key: 'email' };
  if (h.includes('telefone') || h.includes('fone')) return { kind: 'contact', key: 'phone' };
  // Sobrou → é coluna de departamento (valor = responsável interno)
  return { kind: 'dept', key: h.replace(/_/g, ' ') };
}

// ---------------------------- parser ----------------------------
export function parseS3dCsv(text: string): S3dCompany[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const first = lines[0];
  const sep = [';', '\t', ','].reduce(
    (best, s) => (first.split(s).length > first.split(best).length ? s : best),
    ';',
  );

  // Split respeitando aspas ("a; b" não quebra)
  const split = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        q = !q;
        continue;
      }
      if (ch === sep && !q) {
        out.push(cur.trim());
        cur = '';
        continue;
      }
      cur += ch;
    }
    out.push(cur.trim());
    return out;
  };

  const headers = split(first).map((h) => classifyHeader(norm(h)));
  const map = new Map<string, S3dCompany>();

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].toLowerCase().startsWith('filtros utilizados')) continue; // lixo
    const cols = split(lines[i]);
    const row: Record<string, string> = {};
    const depts: S3dOwner[] = [];
    const contact: Record<string, string> = {};

    headers.forEach((h, idx) => {
      const v = (cols[idx] || '').trim();
      if (!v) return;
      if (h.kind === 'field') row[h.key] = v;
      else if (h.kind === 'contact') contact[h.key] = v;
      else depts.push({ department: h.key, ownerName: v });
    });

    const name = row.companyName;
    if (!name) continue;
    const key = digits(row.cnpj) || norm(name);

    if (!map.has(key)) {
      const stateRegs = row.stateRegistrations
        ? row.stateRegistrations
            .split(/[;,]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      map.set(key, {
        s3dId: row.s3dId ? parseInt(row.s3dId, 10) : undefined,
        companyName: name,
        cnpj: digits(row.cnpj) || undefined,
        tradeName: row.tradeName,
        taxRegime: REGIME(row.taxRegime || ''),
        nire: row.nire,
        municipalRegistration: row.municipalRegistration,
        municipalRegistrationDate: row.municipalRegistrationDate,
        stateRegistrations: stateRegs,
        isStateExempt: yes(row.isStateExempt || ''),
        otherIdentifiers: row.otherIdentifiers,
        phone: row.phone,
        address: row.address,
        addressNumber: row.addressNumber,
        addressComplement: row.addressComplement,
        addressDistrict: row.addressDistrict,
        addressCity: row.addressCity,
        addressState: row.addressState,
        addressZip: row.addressZip,
        website: row.website,
        s3dNickname: row.s3dNickname,
        companyGroup: row.companyGroup,
        foundationDate: row.foundationDate,
        clientSince: row.clientSince,
        clientUntil: row.clientUntil,
        s3dRegistrationDate: row.s3dRegistrationDate,
        monthlyFee: brMoney(row.monthlyFee || ''),
        active: row.active === undefined ? undefined : yes(row.active),
        observations: row.observations,
        tags: row.tags
          ? row.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        contacts: [],
        owners: [],
      });
    }
    const comp = map.get(key)!;

    // Contato: dedupe por nome+email
    if (contact.name) {
      const dup = comp.contacts!.find(
        (k) =>
          norm(k.name) === norm(contact.name) &&
          (k.email || '') === (contact.email || ''),
      );
      if (!dup) {
        comp.contacts!.push({
          name: contact.name,
          role: contact.role,
          phone: contact.phone,
          email: contact.email,
          departments: contact.departments
            ? contact.departments
                .split(/[,;]/)
                .map((d) => d.trim())
                .filter(Boolean)
            : [],
        });
      }
    }

    // Responsáveis: primeiro valor não-vazio vence por departamento
    for (const d of depts) {
      if (!comp.owners!.find((o) => norm(o.department) === norm(d.department))) {
        comp.owners!.push(d);
      }
    }
  }

  return Array.from(map.values());
}
// =================================================================
// FIM: frontend/src/lib/parseS3dCsv.ts
// =================================================================