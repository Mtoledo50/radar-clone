import pdfParse from 'pdf-parse';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

// Interfaces mantidas iguais
interface DasData {
  companyName: string;
  cnpj: string;
  period: string;
  totalValue: number;
  breakdown: { [key: string]: number };
}

interface SimulatorData {
  rbt12: number;
  monthlyRevenue: number;
  scenarioInside: { total: number };
  scenarioOutside: { totalFinal: number };
  commerceRevenue: number;
  industryRevenue: number;
  commerceInside: number;
  industryInside: number;
  commerceDasPart: number;
  commerceOutsidePart: number;
  commerceTotal: number;
  industryDasPart: number;
  industryOutsidePart: number;
  industryTotal: number;
  sumDasPart: number;
  sumOutsidePart: number;
  sumTotalActivities: number;
  ibsDebit: number;
  ibsCredit: number;
  cbsDebit: number;
  cbsCredit: number;
  ibsLiquid: number;
  cbsLiquid: number;
  totalCredits: number;
  totalBaseCredit: number;
  inputs: {
    acquisitions: number;
    otherExpenses: number;
    salesPJPercent: number;
    creditPercent: number;
  };
}

interface ReportData extends DasData, SimulatorData {
  generatedAt: string;
  differenceMonthly: number;
  logoBase64: string; // Novo campo para o logo
  accountantInfo: {
    name: string;
    address: string;
    phone: string;
  };
}

export class TaxAnalysisService {

  private formatCurrency(value: any): string {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private parseCurrency(str: string | undefined): number {
    if (!str) return 0;
    // Remove tudo exceto dígitos, ponto e vírgula. Troca ponto por nada e vírgula por ponto.
    const clean = str.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
    const result = parseFloat(clean);
    return isNaN(result) ? 0 : result;
  }

  // Função auxiliar para converter imagem local em Base64 para o HTML
  private imageToBase64(filePath: string): string {
    try {
      const imageBuffer = fs.readFileSync(filePath);
      const extension = path.extname(filePath).toLowerCase();
      const mimeType = extension === '.png' ? 'image/png' : 'image/jpeg';
      return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
    } catch (e) {
      console.warn(`Logo não encontrado em ${filePath}. Usando placeholder.`);
      return ''; 
    }
  }

  async extractDasData(buffer: Buffer): Promise<DasData> {
    const data = await pdfParse(buffer);
    const text = data.text;

    // Regex ajustadas para o layout do DAS enviado
    const cnpjMatch = text.match(/CNPJ[:\s]+(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/);
    
    // Captura Razão Social (geralmente vem após o CNPJ ou em linha específica)
    // No PDF enviado: "57.813.907/0001-97 CONCRETIZE MUROS..."
    const companyMatch = text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\s+([\s\S]*?)(?=\nPeríodo|\nData)/);
    
    const periodMatch = text.match(/Período de Apuração\s+([\w]+\/\d{4})/);
    const totalMatch = text.match(/Valor Total do Documento[\s\S]*?(\d{1,3}(?:\.\d{3})*,\d{2})/);

    // Função flexível para pegar valores de tributos no DAS
    const getVal = (label: string) => {
      // Procura label seguido de qualquer caractere até encontrar um valor monetário
      const regex = new RegExp(`${label}[\\s\\S]*?(\\d{1,3}(?:\\.\\d{3})*,\\d{2})`);
      const match = text.match(regex);
      return this.parseCurrency(match?.[1]);
    };

    return {
      companyName: companyMatch ? companyMatch[1].trim() : 'Não identificado',
      cnpj: cnpjMatch ? cnpjMatch[1] : '',
      period: periodMatch ? periodMatch[1] : '',
      totalValue: this.parseCurrency(totalMatch?.[1]),
      breakdown: {
        irpj: getVal('IRPJ- SIMPLES NACIONAL'),
        csll: getVal('CSLL- SIMPLES NACIONAL'),
        cofins: getVal('COFINS- SIMPLES NACIONAL'),
        pis: getVal('PIS- SIMPLES NACIONAL'),
        inss: getVal('INSS- SIMPLES NACIONAL'),
        ipi: getVal('IPI- SIMPLES NACIONAL'),
        icms: getVal('ICMS- SIMPLES NACIONAL'),
        iss: getVal('ISS- SIMPLES NACIONAL'),
      }
    };
  }

  async extractSimulatorData(buffer: Buffer): Promise<SimulatorData> {
    const data = await pdfParse(buffer);
    const text = data.text;

    // --- DADOS GERAIS ---
    // Ajuste: O PDF usa "RBT12 considerado:" ou "RBT12:"
    const rbt12Match = text.match(/RBT12[^:]*:\s*R\$?\s*([\d.,]+)/i);
    const revenueMatch = text.match(/Receita Bruta Mensal[^:]*:\s*R\$?\s*([\d.,]+)/i);
    
    // --- CENÁRIO POR DENTRO (CONSOLIDADO) ---
    const insideTotalMatch = text.match(/POR DENTRO[\s\S]*?Total[\s\S]*?(\d{1,3}(?:\.\d{3})*,\d{2})/);
    
    // --- CENÁRIO POR FORA (CONSOLIDADO) ---
    const outsideTotalMatch = text.match(/POR FORA[\s\S]*?Total[\s\S]*?(\d{1,3}(?:\.\d{3})*,\d{2})/);

    // --- DETALHES POR ATIVIDADE ---
    // Comércio
    const commerceRevMatch = text.match(/1- Comércio[\s\S]*?Receita Bruta Mensal[:\s]+R\$?\s*([\d.,]+)/);
    const commerceInsideMatch = text.match(/1- Comércio[\s\S]*?TOTAL SIMPLES NACIONAL[:\s]+R\$?\s*([\d.,]+)/);
    const commerceDasPartMatch = text.match(/1- Comércio[\s\S]*?POR FORA[\s\S]*?SIMPLES NACIONAL[:\s]+R\$?([\d.,]+)/);
    const commerceOutsidePartMatch = text.match(/1- Comércio[\s\S]*?POR FORA[\s\S]*?IBS\/CBS POR FORA[:\s]+R\$?([\d.,]+)/);
    const commerceTotalMatch = text.match(/1- Comércio[\s\S]*?POR FORA[\s\S]*?TOTAL DAS\+ IBS\/CBS[:\s]+R\$?([\d.,]+)/);

    // Indústria
    const industryRevMatch = text.match(/2- Indústria[\s\S]*?Receita Bruta Mensal[:\s]+R\$?\s*([\d.,]+)/);
    const industryInsideMatch = text.match(/2- Indústria[\s\S]*?TOTAL SIMPLES NACIONAL[:\s]+R\$?\s*([\d.,]+)/);
    const industryDasPartMatch = text.match(/2- Indústria[\s\S]*?POR FORA[\s\S]*?SIMPLES NACIONAL[:\s]+R\$?([\d.,]+)/);
    const industryOutsidePartMatch = text.match(/2- Indústria[\s\S]*?POR FORA[\s\S]*?IBS\/CBS POR FORA[:\s]+R\$?([\d.,]+)/);
    const industryTotalMatch = text.match(/2- Indústria[\s\S]*?POR FORA[\s\S]*?TOTAL DAS\+ IBS\/CBS[:\s]+R\$?([\d.,]+)/);

    // --- DÉBITOS E CRÉDITOS ---
    const ibsDebitMatch = text.match(/IBS Débito[:\s]+([\d.,]+)/);
    const ibsCreditMatch = text.match(/IBS Crédito[:\s]+([\d.,]+)/);
    const cbsDebitMatch = text.match(/CBS Débito[:\s]+([\d.,]+)/);
    const cbsCreditMatch = text.match(/CBS Crédito[:\s]+([\d.,]+)/);

    // --- INPUTS ---
    const acqMatch = text.match(/Valor das aquisições[:\s]+R\$?\s*([\d.,]+)/);
    const expMatch = text.match(/Valor de outras despesas[:\s]+R\$?\s*([\d.,]+)/);
    const pjMatch = text.match(/Percentual de vendas PJ x PJ[:\s]+([\d,]+)%/);
    const credMatch = text.match(/Percentual de crédito[:\s]+([\d,]+)%/);

    const ibsDebit = this.parseCurrency(ibsDebitMatch?.[1]);
    const ibsCredit = this.parseCurrency(ibsCreditMatch?.[1]);
    const cbsDebit = this.parseCurrency(cbsDebitMatch?.[1]);
    const cbsCredit = this.parseCurrency(cbsCreditMatch?.[1]);

    const commerceDasPart = this.parseCurrency(commerceDasPartMatch?.[1]);
    const commerceOutsidePart = this.parseCurrency(commerceOutsidePartMatch?.[1]);
    const commerceTotal = this.parseCurrency(commerceTotalMatch?.[1]);
    
    const industryDasPart = this.parseCurrency(industryDasPartMatch?.[1]);
    const industryOutsidePart = this.parseCurrency(industryOutsidePartMatch?.[1]);
    const industryTotal = this.parseCurrency(industryTotalMatch?.[1]);

    return {
      rbt12: this.parseCurrency(rbt12Match?.[1]),
      monthlyRevenue: this.parseCurrency(revenueMatch?.[1]),
      scenarioInside: { total: this.parseCurrency(insideTotalMatch?.[1]) },
      scenarioOutside: { totalFinal: this.parseCurrency(outsideTotalMatch?.[1]) },
      commerceRevenue: this.parseCurrency(commerceRevMatch?.[1]),
      industryRevenue: this.parseCurrency(industryRevMatch?.[1]),
      commerceInside: this.parseCurrency(commerceInsideMatch?.[1]),
      industryInside: this.parseCurrency(industryInsideMatch?.[1]),
      commerceDasPart, commerceOutsidePart, commerceTotal,
      industryDasPart, industryOutsidePart, industryTotal,
      sumDasPart: commerceDasPart + industryDasPart,
      sumOutsidePart: commerceOutsidePart + industryOutsidePart,
      sumTotalActivities: commerceTotal + industryTotal,
      ibsDebit, ibsCredit, cbsDebit, cbsCredit,
      ibsLiquid: ibsDebit - ibsCredit,
      cbsLiquid: cbsDebit - cbsCredit,
      totalCredits: ibsCredit + cbsCredit,
      totalBaseCredit: this.parseCurrency(acqMatch?.[1]) + this.parseCurrency(expMatch?.[1]),
      inputs: {
        acquisitions: this.parseCurrency(acqMatch?.[1]),
        otherExpenses: this.parseCurrency(expMatch?.[1]),
        salesPJPercent: this.parseCurrency(pjMatch?.[1]),
        creditPercent: this.parseCurrency(credMatch?.[1])
      }
    };
  }

  async generateReport(dasBuffer: Buffer, simulatorBuffer: Buffer): Promise<Buffer> {
    const dasData = await this.extractDasData(dasBuffer);
    const simData = await this.extractSimulatorData(simulatorBuffer);

    const differenceMonthly = simData.scenarioOutside.totalFinal - simData.scenarioInside.total;

    // Caminho do logo (ajuste conforme sua estrutura de pastas)
    // Sugestão: coloque o logo.png na pasta src/assets ou raiz do backend
    const logoPath = path.join(__dirname, '../assets/logo-conta-certa.png'); 
    
    const reportData: ReportData = {
      ...dasData,
      ...simData,
      generatedAt: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
      differenceMonthly,
      logoBase64: this.imageToBase64(logoPath),
      accountantInfo: {
        name: "Conta Certa Contabilidade",
        address: "Av. Pátria, 287 - Bairro Formosa, Alvorada/RS",
        phone: "984373204"
      }
    };

    const templatePath = path.join(__dirname, '../templates/tax-report.html');
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const compiledTemplate = handlebars.compile(templateSource);
    const htmlContent = compiledTemplate({ ...reportData, formatCurrency: this.formatCurrency });

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'load' });
    
    const pdfUint8Array = await page.pdf({ format: 'A4', printBackground: true });
    const pdfBuffer = Buffer.from(pdfUint8Array);
    
    await browser.close();

    return pdfBuffer;
  }
}