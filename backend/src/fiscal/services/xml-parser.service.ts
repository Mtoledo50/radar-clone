import { Injectable, BadRequestException } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';

// =================================================================
// 📐 INTERFACES DO PARSER — Sprint F6 (Auditoria Tributária Completa)
// =================================================================
// Contrato tipado do XML extraído, com TODAS as alíquotas e bases
// por tributo (ICMS / IPI / PIS / COFINS) — auditoria determinística.
//
// 🧠 Decisão ADR-031: cálculo tributário determinístico.
// O parser apenas EXTRAI o que está no XML; a auditoria (base × alíquota)
// é feita no frontend (modal) e no relatório consolidado, nunca aqui.
// =================================================================

export interface ParsedSupplier {
  cnpj: string;
  name: string;
  tradeName?: string;
  stateRegistration?: string;
  state?: string;
}

/**
 * Item da NF-e com todas as informações fiscais auditáveis.
 *
 * 🆕 Sprint F6:
 * - IPI: ipiBase + ipiRate + ipiValue + ipiCst (antes só tínhamos ipiValue)
 * - PIS: pisBase + pisRate + pisValue + pisCst
 * - COFINS: cofinsBase + cofinsRate + cofinsValue + cofinsCst
 * - ICMS: mantém icmsRate efetiva (tratando CST 51/60/SN)
 */
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

  // ICMS (tributo estadual)
  icmsBase: number;
  icmsRate: number;          // pICMS (ou efetiva em CST 51/60)
  icmsValue: number;
  icmsStBase: number;
  icmsStValue: number;

  // IPI (tributo federal industrial)
  ipiBase: number;
  ipiRate: number;
  ipiValue: number;
  ipiCst?: string;           // CST do IPI (00-99) — crucial p/ IPINT

  // PIS (tributo federal sobre faturamento)
  pisBase: number;
  pisRate: number;
  pisValue: number;
  pisCst?: string;

  // COFINS (tributo federal sobre faturamento)
  cofinsBase: number;
  cofinsRate: number;
  cofinsValue: number;
  cofinsCst?: string;
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

  // Totais consolidados (vêm de ICMSTot)
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
 * ⭐ XmlParserService — Parser NF-e 4.0 com auditoria tributária
 * =================================================================
 * Sprint F6: captura alíquotas REAIS (pIPI/pPIS/pCOFINS) + bases,
 * trata casos especiais (CST 51 diferimento, CST 60 ST retido,
 * IPI por unidade, PIS/COFINS por quantidade, ICMSSN).
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

  /**
   * Extrai a chave de acesso (44 dígitos).
   * Prioriza protNFe (NF-e autorizada pela SEFAZ) sobre o atributo Id.
   */
  private extractAccessKey(json: any, infNFe: any): string {
    const fromProt = this.str(json?.nfeProc?.protNFe?.infProt?.chNFe);
    if (fromProt && fromProt.length === 44) return fromProt;

    const id = this.str(infNFe['@_Id']) || '';
    const cleaned = id.replace(/^NFe/, '');
    if (cleaned.length === 44) return cleaned;

    throw new BadRequestException('Chave de acesso (44 dígitos) não encontrada.');
  }

  /**
   * 🆕 Sprint F6: extrai itens com todas as alíquotas auditáveis.
   * Cada item chama 4 extratores especializados (ICMS, IPI, PIS, COFINS).
   */
  private parseItems(det: any): ParsedItem[] {
    return this.asArray(det).map((d: any) => {
      const prod = d.prod || {};
      const imposto = d.imposto || {};
      const icms = this.extractIcms(imposto.ICMS);
      const ipi = this.extractIpi(imposto.IPI);
      // 🆕 Sprint F6: PIS e COFINS usam o MESMO extrator (estrutura idêntica)
      const pis = this.extractPisCofins(imposto.PIS, 'PIS');
      const cofins = this.extractPisCofins(imposto.COFINS, 'COFINS');

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

        ipiBase: ipi.vBC,
        ipiRate: ipi.pIPI,
        ipiValue: ipi.vIPI,
        ipiCst: ipi.cst,

        // 🆕 Sprint F6: PIS usa pPIS/vPIS do retorno
        pisBase: pis.vBC,
        pisRate: pis.pPIS,
        pisValue: pis.vPIS,
        pisCst: pis.cst,

        // 🆕 Sprint F6: COFINS usa pCOFINS/vCOFINS do retorno
        cofinsBase: cofins.vBC,
        cofinsRate: cofins.pCOFINS,
        cofinsValue: cofins.vCOFINS,
        cofinsCst: cofins.cst,
      };
    });
  }

  /**
   * ICMS cobre TODOS os grupos (00, 10, 20, 30, 40, 41, 50, 51, 60, 70, 90,
   * SN 101/102/201/202/500/900).
   *
   * 🧠 Casos especiais tratados:
   * - CST 51 (DIFERIMENTO): vICMSOp - vICMSDif = vICMS; alíquota efetiva = vICMS/vBC
   * - CST 60 (ST retido): lê vBCSTRet e vICMSSTRet
   * - ICMSSN*: lê pCredSN e vCredICMSSN (alíquota de crédito do Simples)
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

    const cst = this.str(g?.CST);
    const csosn = this.str(g?.CSOSN);

    let vBC = this.num(g?.vBC);
    let pICMS = this.num(g?.pICMS);
    let vICMS = this.num(g?.vICMS);
    const vBCST = this.num(g?.vBCST);
    const vICMSST = this.num(g?.vICMSST);

    // 🆕 CST 51 — Diferimento: o ICMS efetivo é (vICMSOp - vICMSDif)
    // pICMS é a alíquota integral; a efetiva é vICMS/vBC
    if (cst === '51' && vBC > 0) {
      const vICMSOp = this.num(g?.vICMSOp);
      const vICMSDif = this.num(g?.vICMSDif);
      if (vICMSOp > 0) vICMS = vICMSOp - vICMSDif;
      if (vICMS > 0 && vBC > 0) {
        pICMS = Math.round((vICMS / vBC) * 10000) / 100; // 2 casas
      }
    }

    // 🆕 CST 60 — ST cobrado anteriormente: base = vBCSTRet, valor = vICMSSTRet
    if (cst === '60' && vBC === 0) {
      vBC = this.num(g?.vBCSTRet);
      vICMS = this.num(g?.vICMSSTRet);
    }

    // 🆕 ICMSSN — Simples: pCredSN é a alíquota de crédito
    if (csosn && !pICMS) {
      pICMS = this.num(g?.pCredSN);
      if (!vICMS) vICMS = this.num(g?.vCredICMSSN);
    }

    return {
      cst,
      csosn,
      vBC,
      pICMS,
      vICMS,
      vBCST,
      vICMSST,
    };
  }

  /**
   * 🆕 Sprint F6: IPI com base + alíquota OU quantidade × valor unitário.
   *
   * Três formatos no XML:
   * - IPITrib com vBC × pIPI (percentual — maioria dos produtos industriais)
   * - IPITrib com qUnid × vUnid (por unidade — ex: cigarro, bebida)
   * - IPINT (isento/não tributado/suspensão): CST 01-05, 53, 55 — valor 0
   */
  private extractIpi(ipiNode: any) {
    const empty = { cst: undefined as string | undefined, vBC: 0, pIPI: 0, vIPI: 0 };
    if (!ipiNode) return empty;

    const cst = this.str(ipiNode.CST);

    // IPITrib — formato por alíquota (o mais comum)
    if (ipiNode.IPITrib) {
      const vBC = this.num(ipiNode.IPITrib.vBC);
      const pIPI = this.num(ipiNode.IPITrib.pIPI);
      const vIPI = this.num(ipiNode.IPITrib.vIPI);

      // Formato percentual (vBC × pIPI)
      if (pIPI > 0 && vBC > 0) {
        return { cst, vBC, pIPI, vIPI };
      }

      // Formato por unidade (qUnid × vUnid)
      const qUnid = this.num(ipiNode.IPITrib.qUnid);
      const vUnid = this.num(ipiNode.IPITrib.vUnid);
      if (qUnid > 0 && vUnid > 0 && vIPI > 0) {
        const base = qUnid * vUnid;
        const rate = Math.round((vIPI / base) * 10000) / 100;
        return { cst, vBC: base, pIPI: rate, vIPI };
      }

      return { cst, vBC: 0, pIPI: 0, vIPI };
    }

    // IPINT — isento/não tributado/suspensão (CST 53 é suspensão — valor 0)
    if (ipiNode.IPINT) {
      return { cst, vBC: 0, pIPI: 0, vIPI: 0 };
    }

    return empty;
  }

  /**
   * 🆕 Sprint F6: PIS/COFINS com base + alíquota (CORRIGIDO).
   *
   * 🧠 Correção TS2551: o retorno agora expõe pPIS/pCOFINS e vPIS/vCOFINS
   * separadamente, mesmo que o mesmo método seja reutilizado para ambos.
   *
   * Quatro grupos possíveis no XML:
   * - PISAliq/COFINSAliq: vBC × pPIS/100 (formato padrão)
   * - PISQtde/COFINSQtde: qBCProd × vAliqProd
   * - PISNT/COFINSNT: não tributado (CST 04-09) — valor 0
   * - PISOutr/COFINSOutr: qualquer um dos 2 formatos
   *
   * @param node Nó XML (imposto.PIS ou imposto.COFINS)
   * @param tipo 'PIS' ou 'COFINS' — usado para preencher o campo correto no retorno
   */
  private extractPisCofins(node: any, tipo: 'PIS' | 'COFINS') {
    // Retorno base: ambos os campos PIS e COFINS zerados.
    // O consumidor (parseItems) lê pPIS/vPIS quando tipo=PIS
    // ou pCOFINS/vCOFINS quando tipo=COFINS.
    const empty = {
      cst: undefined as string | undefined,
      vBC: 0,
      pPIS: 0,
      vPIS: 0,
      pCOFINS: 0,
      vCOFINS: 0,
    };
    if (!node) return empty;

    // Pega o primeiro grupo não-vazio
    const aliq = node.PISAliq || node.COFINSAliq;
    const qtde = node.PISQtde || node.COFINSQtde;
    const outr = node.PISOutr || node.COFINSOutr;
    const nt = node.PISNT || node.COFINSNT;

    const grupo = aliq || qtde || outr;
    const cst = this.str(grupo?.CST || nt?.CST);

    if (!grupo) return empty;

    const vBC = this.num(grupo.vBC);
    const rate = this.num(grupo.pPIS || grupo.pCOFINS);
    const vTax = this.num(grupo.vPIS || grupo.vCOFINS);

    // Formato por quantidade (qBCProd × vAliqProd)
    if (!rate && vTax > 0) {
      const qBCProd = this.num(grupo.qBCProd);
      const vAliqProd = this.num(grupo.vAliqProd);
      if (qBCProd > 0 && vAliqProd > 0) {
        const base = qBCProd * vAliqProd;
        const effectiveRate = base > 0 ? Math.round((vTax / base) * 10000) / 100 : 0;

        // Preenche o campo correspondente ao tipo (PIS ou COFINS)
        if (tipo === 'PIS') {
          return {
            cst,
            vBC: base,
            pPIS: effectiveRate,
            vPIS: vTax,
            pCOFINS: 0,
            vCOFINS: 0,
          };
        }
        return {
          cst,
          vBC: base,
          pPIS: 0,
          vPIS: 0,
          pCOFINS: effectiveRate,
          vCOFINS: vTax,
        };
      }
    }

    // Formato percentual padrão (vBC × alíquota)
    if (tipo === 'PIS') {
      return {
        cst,
        vBC,
        pPIS: rate,
        vPIS: vTax,
        pCOFINS: 0,
        vCOFINS: 0,
      };
    }
    return {
      cst,
      vBC,
      pPIS: 0,
      vPIS: 0,
      pCOFINS: rate,
      vCOFINS: vTax,
    };
  }

  /** Converte qualquer valor para number, retornando 0 em NaN/undefined. */
  private num(v: any): number {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  /** Converte qualquer valor para string (null/undefined → undefined). */
  private str(v: any): string | undefined {
    return v === undefined || v === null ? undefined : String(v);
  }

  /** Garante que o valor é sempre array (XMLParser retorna objeto quando há 1 só). */
  private asArray(v: any): any[] {
    if (v === undefined || v === null) return [];
    return Array.isArray(v) ? v : [v];
  }
}