# ADR-035: Geração de PDFs no Backend (Nunca no Frontend)

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O sistema gera diversos documentos em PDF:
- Relatórios mensais de clientes (DRE, Balancete)
- Guias de imposto (DAS, ISS, DARF)
- Propostas comerciais
- SPED Fiscal
- Etiquetas e comprovantes

**Problema:**
- Gerar PDF no frontend (com `jspdf` ou `html2canvas`) consome CPU do navegador
- PDFs grandes (100+ páginas) travam o navegador do contador
- Diferentes navegadores podem gerar PDFs ligeiramente diferentes (inconsistência)
- Dificuldade de cache e reutilização (se o cliente pedir o mesmo PDF 2×, recalcula tudo)
- Impossível gerar PDF em background (ex: Aurora enviando relatório mensal automático)

**Dilema:**
Onde gerar os PDFs: no cliente (frontend) ou no servidor (backend)?

---

## 🎯 Decisão

**Todos os PDFs DEVE ser gerados no backend**, usando bibliotecas Node.js como `@react-pdf/renderer` (para layouts complexos com componentes React) ou `jspdf` + `jspdf-autotable` (para tabelas simples).

### Regras:

1. **Backend como Fonte da Verdade:**
   - O frontend **NUNCA** gera PDFs diretamente
   - O frontend apenas solicita o PDF via `GET /endpoint/:id/pdf` e recebe o arquivo
   - Isso garante consistência (mesmo input = mesmo output, independente do navegador)

2. **Bibliotecas Permitidas:**
   - `@react-pdf/renderer` (v2.3.0+): Para layouts complexos com componentes React (ex: relatórios com gráficos, tabelas estilizadas)
   - `jspdf` (2.5.2) + `jspdf-autotable` (3.8.2): Para tabelas simples e documentos rápidos
   - **NUNCA** usar `html2canvas` (lento, inconsistente, quebra em PDFs grandes)

3. **Cache de PDFs (Opcional):**
   - PDFs que não mudam com frequência (ex: guia de imposto já emitida) podem ser cacheados em disco
   - Chave de cache: `companyId + clientId + type + period + hash(dados)`
   - TTL: 30 dias ou até que os dados mudem

4. **Streaming para Arquivos Grandes:**
   - PDFs com mais de 50 páginas devem usar streaming (`res.setHeader('Content-Type', 'application/pdf')` + `pipe`)
   - Evita carregar o PDF inteiro na memória do servidor

---

## 💡 Implementação

### Backend: Serviço de Geração de PDF com `jspdf`

```typescript
// backend/src/common/services/pdf.service.ts

import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PdfService {
  constructor(private prisma: PrismaService) {}

  /**
   * Gera PDF de relatório mensal do cliente (DRE + Balancete)
   * 
   * @param companyId - ID do escritório
   * @param clientId - ID do cliente
   * @param competence - Competência (ex: "2026-08")
   * @returns Buffer do PDF
   */
  async generateMonthlyReport(
    companyId: string,
    clientId: string,
    competence: string,
  ): Promise<Buffer> {
    // 1. Buscar dados
    const client = await this.prisma.client.findUnique({
      where: { id: clientId, companyId },
    });

    if (!client) throw new NotFoundException('Cliente não encontrado');

    const dre = await this.calculateDRE(companyId, clientId, competence);
    const balancete = await this.calculateBalancete(companyId, clientId, competence);

    // 2. Criar documento PDF
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => {});

    // 3. Cabeçalho
    doc
      .fontSize(20)
      .text(`Relatório Mensal - ${client.name}`, { align: 'center' })
      .moveDown(0.5)
      .fontSize(12)
      .text(`Competência: ${competence}`, { align: 'center' })
      .moveDown(2);

    // 4. DRE (Demonstração do Resultado)
    doc.fontSize(16).text('DRE - Demonstração do Resultado', { underline: true });
    doc.moveDown(1);

    doc.fontSize(11);
    for (const line of dre) {
      doc.text(`${line.description.padEnd(50)} R$ ${line.value.toFixed(2).padStart(12)}`);
    }

    doc.moveDown(2);

    // 5. Balancete (resumo)
    doc.fontSize(16).text('Balancete (Resumo)', { underline: true });
    doc.moveDown(1);

    doc.fontSize(11);
    doc.text(`Total de Débitos: R$ ${balancete.totalDebit.toFixed(2)}`);
    doc.text(`Total de Créditos: R$ ${balancete.totalCredit.toFixed(2)}`);
    doc.text(`Saldo: R$ ${balancete.balance.toFixed(2)}`);

    // 6. Rodapé
    doc.moveDown(3);
    doc.fontSize(8).text('Gerado pelo Radar Conta Certa em ' + new Date().toLocaleString('pt-BR'), {
      align: 'center',
    });

    // 7. Finalizar
    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });
  }
}

Backend: Controller com Streaming

// backend/src/reports/reports.controller.ts

import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { PdfService } from '../common/services/pdf.service';

@Controller('reports')
export class ReportsController {
  constructor(private pdfService: PdfService) {}

  @Get('monthly-report/:clientId/:competence/pdf')
  async getMonthlyReportPdf(
    @Param('clientId') clientId: string,
    @Param('competence') competence: string,
    @Res() res: Response,
  ) {
    const companyId = res.locals.user.companyId; // Do JwtAuthGuard

    try {
      // 1. Gerar PDF
      const pdfBuffer = await this.pdfService.generateMonthlyReport(
        companyId,
        clientId,
        competence,
      );

      // 2. Configurar headers
      const filename = `relatorio-${competence}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // 3. Enviar PDF
      res.send(pdfBuffer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Erro ao gerar PDF' });
      }
    }
  }
}

Frontend: Download do PDF

// frontend/src/app/dashboard/relatorios/page.tsx

import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function RelatoriosPage() {
  const downloadPdf = async (clientId: string, competence: string) => {
    try {
      toast.loading('Gerando PDF...');

      const response = await api.get(
        `/reports/monthly-report/${clientId}/${competence}/pdf`,
        {
          responseType: 'blob', // Importante: receber como blob
        }
      );

      // Criar URL temporária
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-${competence}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('PDF baixado com sucesso');
    } catch (error) {
      toast.error('Erro ao baixar PDF');
    }
  };

  return (
    <button
      onClick={() => downloadPdf('client-123', '2026-08')}
      className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
    >
      📄 Baixar Relatório Mensal
    </button>
  );
}

Alternativa: @react-pdf/renderer (Para Layouts Complexos)


// backend/src/common/services/pdf-react.service.ts

import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12 },
  title: { fontSize: 20, marginBottom: 10, textAlign: 'center' },
  section: { marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
});

function MonthlyReportPdf({ client, competence, dre }: any) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Relatório Mensal - {client.name}</Text>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>
          Competência: {competence}
        </Text>

        <View style={styles.section}>
          <Text style={{ fontSize: 16, marginBottom: 10 }}>DRE</Text>
          {dre.map((line: any, i: number) => (
            <View key={i} style={styles.row}>
              <Text>{line.description}</Text>
              <Text>R$ {line.value.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

export async function generatePdfWithReactPdf(data: any): Promise<Buffer> {
  return renderToBuffer(<MonthlyReportPdf {...data} />);
}

✅ Consequências

Positivas

✅ Performance: Servidor tem mais CPU/memória que o navegador do cliente
✅ Consistência: Mesmo PDF independente do navegador (Chrome, Firefox, Edge)
✅ Cache: PDFs podem ser cacheados em disco (evita recálculo)
✅ Background: Aurora pode gerar e enviar PDFs automaticamente (ex: relatório mensal no dia 5)
✅ Segurança: Lógica de negócio (cálculos, dados sensíveis) fica no backend

Negativas

❌ Carga no Servidor: Cada geração de PDF consome CPU/memória do backend
❌ Latência: Usuário precisa esperar o backend gerar o PDF (2-10s para relatórios grandes)
❌ Complexidade: Exige bibliotecas adicionais (pdfkit, @react-pdf/renderer)

📚 Referências

Arquivos que usam esta ADR:

backend/src/common/services/pdf.service.ts (geração com pdfkit)
backend/src/reports/reports.controller.ts (endpoint de download)
backend/src/digital-employee/skills/monthly-report-skill.ts (Aurora gera PDF automático)
frontend/src/app/dashboard/relatorios/page.tsx (download no frontend)

ADRs relacionadas:

ADR-097 (Motor de PDF white-label no backend com @react-pdf/renderer)

Bibliotecas Utilizadas:

pdfkit: https://pdfkit.org/ (geração de PDF com Node.js)
@react-pdf/renderer: https://react-pdf.org/ (PDF com componentes React)
jspdf + jspdf-autotable: Para tabelas simples

🔄 Histórico de Revisões

Data                Autor               Mudança
2026-08             Marcos Toledo       Criação inicial
2026-09             Marcos Toledo       Adicionado exemplo com @react-pdf/renderer