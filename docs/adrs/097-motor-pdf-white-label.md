# ADR-097: Motor de PDF White-Label no Backend com @react-pdf/renderer

**Data:** 2026-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O sistema gera relatórios contábeis mensais (DRE, Balancete, Relatório Mensal) que precisam ser enviados aos clientes com a identidade visual do escritório (logo, cores, rodapé).

**Problema:**
- PDFs gerados no frontend (ADR-045) não têm acesso ao backend para buscar dados completos
- Layouts complexos (tabelas, gráficos, múltiplas páginas) são difíceis no cliente
- White-label exige injeção dinâmica de logo e cores por tenant

## 🎯 Decisão

Usar **`@react-pdf/renderer`** no backend para gerar PDFs com:
- Componentes React (facilita manutenção)
- Suporte a imagens (logo do tenant)
- Suporte a tabelas complexas
- Injeção de CSS variables para white-label

### Regras:
1. **Backend como fonte da verdade:** Dados buscados do Prisma, nunca do frontend
2. **White-label dinâmico:** Logo e cores injetados via `Company.branding`
3. **Cache opcional:** PDFs de relatórios mensais podem ser cacheados em disco (TTL 30 dias)
4. **Streaming para arquivos grandes:** PDFs > 50 páginas usam streaming (não buffer completo)

## 💡 Implementação

### Backend: Componente PDF com White-Label

```typescript
// backend/src/common/pdf/relatorio-mensal.tsx

import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 11, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  logo: { width: 120, height: 40 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0d9488' },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#0d9488' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }
});

interface Props {
  company: { name: string; logoUrl?: string; primaryColor: string };
  client: { name: string; cnpj: string };
  competence: string;
  dre: { description: string; value: number }[];
  balancete: { totalDebit: number; totalCredit: number; balance: number };
}

export function RelatorioMensalPdf({ company, client, competence, dre, balancete }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header com logo e cores do tenant */}
        <View style={styles.header}>
          {company.logoUrl && <Image src={company.logoUrl} style={styles.logo} />}
          <Text style={[styles.title, { color: company.primaryColor }]}>
            Relatório Mensal
          </Text>
        </View>

        {/* Dados do cliente */}
        <View style={styles.section}>
          <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{client.name}</Text>
          <Text>CNPJ: {client.cnpj}</Text>
          <Text>Competência: {competence}</Text>
        </View>

        {/* DRE */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: company.primaryColor }]}>
            DRE - Demonstração do Resultado
          </Text>
          {dre.map((line, i) => (
            <View key={i} style={styles.row}>
              <Text>{line.description}</Text>
              <Text>R$ {line.value.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Balancete */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: company.primaryColor }]}>
            Balancete
          </Text>
          <View style={styles.row}>
            <Text>Total de Débitos:</Text>
            <Text>R$ {balancete.totalDebit.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Total de Créditos:</Text>
            <Text>R$ {balancete.totalCredit.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={{ fontWeight: 'bold' }}>Saldo:</Text>
            <Text style={{ fontWeight: 'bold' }}>R$ {balancete.balance.toFixed(2)}</Text>
          </View>
        </View>

        {/* Rodapé */}
        <View style={{ position: 'absolute', bottom: 30, left: 30, right: 30 }}>
          <Text style={{ fontSize: 8, textAlign: 'center', color: '#666' }}>
            Gerado por {company.name} em {new Date().toLocaleDateString('pt-BR')}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

Backend: Serviço de Geração

// backend/src/common/services/pdf-white-label.service.ts

import { renderToBuffer } from '@react-pdf/renderer';
import { RelatorioMensalPdf } from '../pdf/relatorio-mensal';

@Injectable()
export class PdfWhiteLabelService {
  async generateRelatorioMensal(companyId: string, clientId: string, competence: string) {
    // 1. Buscar dados
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, logoUrl: true, primaryColor: true }
    });
    
    const client = await this.prisma.client.findUnique({
      where: { id: clientId, companyId }
    });

    const dre = await this.calculateDRE(companyId, clientId, competence);
    const balancete = await this.calculateBalancete(companyId, clientId, competence);

    // 2. Renderizar PDF
    const buffer = await renderToBuffer(
      <RelatorioMensalPdf
        company={company}
        client={client}
        competence={competence}
        dre={dre}
        balancete={balancete}
      />
    );

    return buffer;
  }
}

✅ Consequências4
Positivas

✅ White-Label Real: Logo e cores do tenant em cada PDF
✅ Componentes React: Fácil manutenção e evolução
✅ Backend: Dados completos do banco, sem limitações de frontend

Negativas

❌ Performance: @react-pdf/renderer é pesado (~50MB de dependências)
❌ Build Time: Aumenta tempo de build do backend

📚 Referências

Arquivos que usam esta ADR:

backend/src/common/pdf/relatorio-mensal.tsx
backend/src/common/services/pdf-white-label.service.ts
backend/src/digital-employee/skills/monthly-report-skill.ts

ADRs relacionadas:

ADR-035 (PDFs no backend)
ADR-043 (White-label via CSS variables)

🔄 Histórico de Revisões

Data                Autor               Mudança
2026-09             Marcos Toledo       Criação inicial