import { Injectable, BadRequestException } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';

// =================================================================
// 📐 INTERFACES DO PARSER (contrato tipado do XML extraído)
// =================================================================

export interface ParsedSupplier {
  cnpj: string;
  name: string;
  tradeName?: string;
  stateRegistration?: string;
  state?: string;
}

export interface ParsedItem {
  itemNumber: number;
  supplierCode?: string;
  ean?: string;
  description: string;
  ncm: string;
  cfop: string;
  unit: string;
  cst?: string;
  csosn?: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  discount: number;
  icmsBase: number;
  icmsRate: number;
  icmsValue: number;
  icmsStBase: number;
  icmsStValue: number;
  ipiValue: number;
  pisValue: number;
  cofinsValue: number;
}

export interface ParsedInvoice {
  accessKey: string;
  number: string;
  series: string;
  emissionDate: Date;
  natOp?: string;
  cfop?: string;
  supplier: ParsedSupplier;
  totalValue: number;
  discountValue: number;
  freightValue: number;
  insuranceValue: number;
  otherValues: number;
  icmsBase: number;
  icmsValue: number;
  icmsStValue: number;
  ipiValue: number;
  pisValue: number;
  cofinsValue: number;
  items: ParsedItem[];
}

/**
 * =================================================================
 * ⭐ XmlParserService — Parser de NF-e (layout 4.0)
 * =================================================================
 * Extrai de forma SEGURA e TOLERANTE a falhas:
 * - Chave de acesso (44 dígitos)
 * - Dados do emitente (fornecedor)
 * - Itens com NCM, CFOP, CST/CSOSN e impostos (ICMS, ST, IPI, PIS, COFINS)
 * - Totais da nota (ICMSTot)
 *
 * 🛡️ Princípios:
 * - Nunca lança exceção por campo ausente (usa defaults 0/null)
 * - Suporta CST (Presumido/Real) e CSOSN (Simples Nacional)
 * - removeNSPrefix: aceita XMLs com ou sem prefixo de namespace
 * =================================================================
 */
@Injectable()
export class XmlParserService {
  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
    trimValues: true,
    allowBooleanAttributes: true,
  });

  /**
   * Converte o XML em um ParsedInvoice tipado.
   * @throws BadRequestException se o XML não for uma NF-e válida
   */
  parse(xmlContent: string): ParsedInvoice {
    let json: any;
    try {
      json = this.parser.parse(xmlContent);
    } catch {
      throw new BadRequestException('Arquivo não é um XML válido.');
    }

    // Aceita nfeProc (NF-e autorizada) ou NFe solto
    const nfe = json?.nfeProc?.NFe || json?.NFe;
    const infNFe = nfe?.infNFe;

    if (!infNFe) {
      throw new BadRequestException(
        'XML não contém uma NF-e válida (infNFe não encontrado).',
      );
    }

    // Chave de acesso: Id do infNFe ("NFe" + 44 dígitos) ou protNFe
    const accessKey = this.extractAccessKey(json, infNFe);

    const ide = infNFe.ide || {};
    const emit = infNFe.emit || {};
    const tot = infNFe.total?.ICMSTot || {};

    const emissionRaw = ide.dhEmi || ide.dEmi;
    const emissionDate = new Date(emissionRaw);
    if (isNaN(emissionDate.getTime())) {
      throw new BadRequestException('Data de emissão inválida na NF-e.');
    }

    return {
      accessKey,
      number: this.str(ide.nNF) || '0',
      series: this.str(ide.serie) || '1',
      emissionDate,
      natOp: this.str(ide.natOp),
      cfop: this.str(ide.CFOP),
      supplier: {
        cnpj: this.str(emit.CNPJ) || this.str(emit.CPF) || '',
        name: this.str(emit.xNome) || 'FORNECEDOR NÃO IDENTIFICADO',
        tradeName: this.str(emit.xFant),
        stateRegistration: this.str(emit.IE),
        state: this.str(emit.enderEmit?.UF),
      },
      totalValue: this.num(tot.vNF),
      discountValue: this.num(tot.vDesc),
      freightValue: this.num(tot.vFrete),
      insuranceValue: this.num(tot.vSeg),
      otherValues: this.num(tot.vOutro),
      icmsBase: this.num(tot.vBC),
      icmsValue: this.num(tot.vICMS),
      icmsStValue: this.num(tot.vST),
      ipiValue: this.num(tot.vIPI),
      pisValue: this.num(tot.vPIS),
      cofinsValue: this.num(tot.vCOFINS),
      items: this.parseItems(infNFe.det),
    };
  }

  // ---------------------------------------------------------------
  // 🔑 Helpers privados
  // ---------------------------------------------------------------

  private extractAccessKey(json: any, infNFe: any): string {
    const fromProt = this.str(json?.nfeProc?.protNFe?.infProt?.chNFe);
    if (fromProt && fromProt.length === 44) return fromProt;

    const id = this.str(infNFe['@_Id']) || '';
    const cleaned = id.replace(/^NFe/, '');
    if (cleaned.length === 44) return cleaned;

    throw new BadRequestException('Chave de acesso (44 dígitos) não encontrada.');
  }

  private parseItems(det: any): ParsedItem[] {
    return this.asArray(det).map((d: any) => {
      const prod = d.prod || {};
      const imposto = d.imposto || {};
      const icms = this.extractIcms(imposto.ICMS);

      return {
        itemNumber: this.num(d['@_nItem']),
        supplierCode: this.str(prod.cProd),
        ean: this.str(prod.cEAN) !== 'SEM GTIN' ? this.str(prod.cEAN) : null,
        description: this.str(prod.xProd) || 'ITEM SEM DESCRIÇÃO',
        ncm: this.str(prod.NCM) || '',
        cfop: this.str(prod.CFOP) || '',
        unit: this.str(prod.uCom) || 'UN',
        cst: icms.cst,
        csosn: icms.csosn,
        quantity: this.num(prod.qCom),
        unitValue: this.num(prod.vUnCom),
        totalValue: this.num(prod.vProd),
        discount: this.num(prod.vDesc),
        icmsBase: icms.vBC,
        icmsRate: icms.pICMS,
        icmsValue: icms.vICMS,
        icmsStBase: icms.vBCST,
        icmsStValue: icms.vICMSST,
        ipiValue: this.extractTaxValue(imposto.IPI, 'vIPI'),
        pisValue: this.extractTaxValue(imposto.PIS, 'vPIS'),
        cofinsValue: this.extractTaxValue(imposto.COFINS, 'vCOFINS'),
      };
    });
  }

  /**
   * ICMS vem em grupos variados (ICMS00, ICMS20, ICMSSN102...).
   * Localiza o grupo presente e extrai os valores comuns.
   */
  private extractIcms(icmsNode: any) {
    const empty = {
      cst: undefined as string | undefined,
      csosn: undefined as string | undefined,
      vBC: 0,
      pICMS: 0,
      vICMS: 0,
      vBCST: 0,
      vICMSST: 0,
    };
    if (!icmsNode) return empty;

    const groupKey = Object.keys(icmsNode).find((k) => k.startsWith('ICMS'));
    const g = groupKey ? icmsNode[groupKey] : icmsNode;

    return {
      cst: this.str(g?.CST),
      csosn: this.str(g?.CSOSN),
      vBC: this.num(g?.vBC),
      pICMS: this.num(g?.pICMS),
      vICMS: this.num(g?.vICMS),
      vBCST: this.num(g?.vBCST),
      vICMSST: this.num(g?.vICMSST),
    };
  }

  /** PIS/COFINS/IPI também vêm em grupos (PISAliq, PISNT, IPITrib...) */
  private extractTaxValue(node: any, valueKey: string): number {
    if (!node) return 0;
    for (const key of Object.keys(node)) {
      const v = this.num(node[key]?.[valueKey]);
      if (v) return v;
    }
    return 0;
  }

  private num(v: any): number {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  private str(v: any): string | undefined {
    return v === undefined || v === null ? undefined : String(v);
  }

  private asArray(v: any): any[] {
    if (v === undefined || v === null) return [];
    return Array.isArray(v) ? v : [v];
  }
}