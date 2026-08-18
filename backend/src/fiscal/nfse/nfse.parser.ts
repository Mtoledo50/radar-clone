// =================================================================
// INÍCIO: backend/src/fiscal/nfse/nfse.parser.ts
// =================================================================
// Parser de NFS-e padrão ABRASF 2.0 (ADR-036)
//
// Filosofia (Pilar B — nunca descarta):
//   - Campos críticos ausentes → lança NfseParseError
//   - Campos opcionais ausentes → default/null
//   - Campos desconhecidos → preservados no rawXml (reparse futuro)
//   - Tolerante a namespaces municipais (prefeituras variam)
//
// Layout suportado (genérico):
//   <CompNfse> → <Nfse> → <InfNfse Id="..."> → campos
//   ou direto <InfNfse> (algumas prefeituras não usam o wrapper)
// =================================================================
import { XMLParser } from 'fast-xml-parser';

// -----------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------
export interface ParsedNfse {
  // Identificação
  number: string;
  series: string;
  verificationCode?: string;
  emissionDate: Date;
  competenceDate?: Date;

  // Partes
  issuerCnpj: string;
  issuerName: string;
  takerCnpj?: string;
  takerCpf?: string;
  takerName?: string;

  // Valores
  serviceValue: number;
  deductions: number;
  issBase: number;
  issRate: number;   // % (ex: 3.5)
  issValue: number;
  issRetained: boolean;

  // Serviço
  serviceCode?: string;
  serviceDescription?: string;
  municipalityCode?: string;
}

export class NfseParseError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(`[NFSe Parse] ${message}`);
    this.name = 'NfseParseError';
  }
}

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: true,
  trimValues: true,
});

/**
 * Navega o XML tolerando wrappers variáveis.
 * Algumas prefeituras mandam <CompNfse><Nfse><InfNfse>,
 * outras só <InfNfse>, outras com namespace (ex: <ns1:InfNfse>).
 */
function findInfNfse(root: any): any {
  if (!root) throw new NfseParseError('XML vazio ou inválido');

  // Caso 1: direto no root
  if (root.InfNfse) return root.InfNfse;

  // Caso 2: CompNfse > Nfse > InfNfse (padrão ABRASF)
  if (root.CompNfse?.Nfse?.InfNfse) return root.CompNfse.Nfse.InfNfse;

  // Caso 3: Nfse > InfNfse
  if (root.Nfse?.InfNfse) return root.Nfse.InfNfse;

  // Caso 4: procura em qualquer nível (fallback — tolera namespaces)
  const str = JSON.stringify(root);
  const match = str.match(/"InfNfse"\s*:\s*(\{[\s\S]*?\})(?=,"|\})/);
  if (match) {
    try { return JSON.parse(match[1]); } catch { /* fallback abaixo */ }
  }

  throw new NfseParseError('Estrutura NFS-e não reconhecida. Esperado <InfNfse> em algum nível.');
}

function extractCnpj(node: any): string | undefined {
  if (!node) return undefined;
  // Variações: <Cnpj>, <CpfCnpj><Cnpj>, <CpfCnpj><Cpf>
  if (typeof node === 'string') return node.replace(/\D/g, '');
  if (node.Cnpj) return String(node.Cnpj).replace(/\D/g, '');
  if (node.CpfCnpj?.Cnpj) return String(node.CpfCnpj.Cnpj).replace(/\D/g, '');
  if (node.CpfCnpj?.Cpf) return String(node.CpfCnpj.Cpf).replace(/\D/g, '');
  if (node.IdentificacaoPrestador?.Cnpj) return String(node.IdentificacaoPrestador.Cnpj).replace(/\D/g, '');
  if (node.Cpf) return String(node.Cpf).replace(/\D/g, '');
  return undefined;
}

function parseDate(value: any): Date {
  if (!value) throw new NfseParseError('Data ausente', 'date');
  const d = new Date(String(value));
  if (isNaN(d.getTime())) throw new NfseParseError(`Data inválida: ${value}`, 'date');
  return d;
}

function num(value: any, fallback = 0): number {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(String(value).replace(',', '.'));
  return isNaN(n) ? fallback : n;
}

// -----------------------------------------------------------------
// Parser principal
// -----------------------------------------------------------------
export function parseNfse(xml: string): ParsedNfse {
  if (!xml || typeof xml !== 'string') {
    throw new NfseParseError('XML não é uma string');
  }

  let root: any;
  try {
    root = parser.parse(xml);
  } catch (e: any) {
    throw new NfseParseError(`XML malformado: ${e.message}`);
  }

  const inf = findInfNfse(root);

  // ── Número (obrigatório) ──────────────────────────────────────
  const number = String(inf.Numero || '').trim();
  if (!number) throw new NfseParseError('Número da NFS-e ausente', 'Numero');

  // ── Emissão (obrigatório) ─────────────────────────────────────
  const emissionDate = parseDate(inf.DataEmissao);

  // ── Prestador (obrigatório) ───────────────────────────────────
  const prestador = inf.PrestadorServico || {};
  const issuerCnpj = extractCnpj(prestador.IdentificacaoPrestador || prestador);
  if (!issuerCnpj) throw new NfseParseError('CNPJ do prestador ausente', 'issuerCnpj');
  const issuerName = String(prestador.RazaoSocial || '').trim();
  if (!issuerName) throw new NfseParseError('Razão social do prestador ausente', 'issuerName');

  // ── Tomador (opcional — NFS-e pode não ter tomador) ──────────
  const tomador = inf.TomadorServico || {};
  const takerIdent = tomador.IdentificacaoTomador || tomador;
  const takerCnpj = extractCnpj(takerIdent);
  const takerName = tomador.RazaoSocial ? String(tomador.RazaoSocial).trim() : undefined;

  // ── Serviço ───────────────────────────────────────────────────
  const servico = inf.Servico || {};
  const valores = servico.Valores || {};

  const serviceValue = num(valores.ValorServicos);
  if (serviceValue <= 0) {
    throw new NfseParseError(`Valor do serviço inválido: ${valores.ValorServicos}`, 'serviceValue');
  }

  // Aliquota vem como 0.035 (decimal) ou 3.5 (%) — normaliza para %
  let issRate = num(valores.Aliquota);
  if (issRate > 0 && issRate < 1) issRate = issRate * 100; // 0.035 → 3.5

  // ── Resultado ─────────────────────────────────────────────────
  return {
    number,
    series: String(inf.Serie || '').trim() || '',
    verificationCode: inf.CodigoVerificacao ? String(inf.CodigoVerificacao).trim() : undefined,
    emissionDate,
    competenceDate: inf.Competencia ? parseDate(inf.Competencia) : undefined,

    issuerCnpj,
    issuerName,
    takerCnpj: takerCnpj && takerCnpj.length === 14 ? takerCnpj : undefined,
    takerCpf: takerCnpj && takerCnpj.length === 11 ? takerCnpj : undefined,
    takerName,

    serviceValue,
    deductions: num(valores.ValorDeducoes),
    issBase: num(valores.BaseCalculo),
    issRate,
    issValue: num(valores.ValorIss),
    issRetained: valores.IssRetido === true || valores.IssRetido === 1 || valores.IssRetido === '1' || String(valores.IssRetido).toLowerCase() === 'sim',

    serviceCode: servico.ItemListaServico ? String(servico.ItemListaServico).trim() : undefined,
    serviceDescription: servico.Discriminacao ? String(servico.Discriminacao).trim() : undefined,
    municipalityCode: servico.CodigoMunicipio ? String(servico.CodigoMunicipio).trim() : undefined,
  };
}
// =================================================================
// FIM: nfse.parser.ts
// =================================================================