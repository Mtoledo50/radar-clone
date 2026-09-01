// =================================================================
// ARQUIVO: backend/src/reports/templates/BalanceteDocument.tsx
// =================================================================
// Template do Balancete Patrimonial (ADR-098)
// White-label: usa cores do tenant (Company.primaryColor)
// Agrupa contas por tipo (ATIVO, PASSIVO, PATRIMONIO_LIQUIDO)
// =================================================================
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helvetica/v1/Helvetica.ttf' },
    { src: 'https://fonts.gstatic.com/s/helvetica/v1/Helvetica-Bold.ttf', fontWeight: 'bold' },
  ],
});

// =================================================================
// ESTILOS
// =================================================================
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottom: '2px solid',
    marginBottom: 24,
  },
  logo: { fontSize: 20, fontWeight: 'bold' },
  logoAccent: { fontSize: 20, fontWeight: 'bold' },
  meta: { textAlign: 'right', fontSize: 9, color: '#64748b' },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 11,
    textAlign: 'center',
    color: '#475569',
    marginBottom: 24,
  },
  clientInfo: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 4,
    marginBottom: 20,
    border: '1px solid #e2e8f0',
  },
  clientName: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  clientDetail: { fontSize: 9, color: '#64748b' },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: '#0d9488',
    color: 'white',
    padding: '6 10',
    borderRadius: 4,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: '6 8',
    borderRadius: 4,
    fontWeight: 'bold',
    fontSize: 9,
    textTransform: 'uppercase',
    color: '#475569',
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '4 8',
    borderBottom: '0.5px solid #e2e8f0',
    fontSize: 9,
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: '4 8',
    borderBottom: '0.5px solid #e2e8f0',
    fontSize: 9,
    backgroundColor: '#f8fafc',
  },
  colCode: { width: 70, fontSize: 8, color: '#64748b' },
  colName: { flex: 1, paddingLeft: 4 },
  colValue: { width: 90, textAlign: 'right', fontWeight: 'bold', paddingRight: 8 },
  totalRow: {
    flexDirection: 'row',
    padding: '8 8',
    marginTop: 8,
    borderTop: '2px solid',
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    fontWeight: 'bold',
  },
  totalLabel: { flex: 1, fontSize: 10, paddingLeft: 4 },
  totalValue: { width: 90, textAlign: 'right', fontSize: 11, paddingRight: 8 },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTop: '0.5px solid #e2e8f0',
    paddingTop: 8,
  },
});

// =================================================================
// HELPERS
// =================================================================
const fmtBRL = (v: number) => {
  const abs = Math.abs(v);
  const formatted = abs.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return v < 0 ? `(R$ ${formatted})` : `R$ ${formatted}`;
};

const fmtBRLZero = (v: number) => {
  if (v === 0) return 'R$ 0,00';
  return fmtBRL(v);
};

// =================================================================
// TIPOS
// =================================================================
interface BalanceteAccount {
  code: string;
  name: string;
  type: string;
  level: number;
  saldoDevedor: number;
  saldoCredor: number;
  saldoLiquido: number;
}

interface BalanceteDocumentProps {
  companyName: string;
  cnpj?: string;
  period: string;
  periodLabel: string;
  accounts: BalanceteAccount[];
  totalAtivo: number;
  totalPassivo: number;
  totalPL: number;
  primaryColor: string;
  secondaryColor: string;
  officeName: string;
  officeCnpj?: string;
}

// =================================================================
// COMPONENTE PRINCIPAL
// =================================================================
export const BalanceteDocument: React.FC<BalanceteDocumentProps> = ({
  companyName,
  cnpj,
  period,
  periodLabel,
  accounts,
  totalAtivo,
  totalPassivo,
  totalPL,
  primaryColor,
  secondaryColor,
  officeName,
  officeCnpj,
}) => {
  const dynamicStyles = StyleSheet.create({
    headerBorder: { borderBottomColor: primaryColor },
    sectionTitle: { backgroundColor: primaryColor },
    totalRow: { borderTopColor: secondaryColor },
    logoAccent: { color: secondaryColor },
  });

  // Agrupa contas por tipo
  const ativoAccounts = accounts.filter((a) => a.type === 'ATIVO');
  const passivoAccounts = accounts.filter((a) => a.type === 'PASSIVO');
  const plAccounts = accounts.filter((a) => a.type === 'PATRIMONIO_LIQUIDO');

  const renderAccountRow = (account: BalanceteAccount, idx: number) => {
    const isSynthetic = account.level <= 2;
    const indent = account.level > 1 ? (account.level - 1) * 8 : 0;

    return (
      <View
        key={`${account.code}-${idx}`}
        style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
      >
        <Text style={[styles.colCode, { paddingLeft: indent }]}>
          {account.code}
        </Text>
        <Text
          style={[
            styles.colName,
            isSynthetic && { fontWeight: 'bold', color: '#0f172a' },
          ]}
        >
          {account.name}
        </Text>
        <Text style={styles.colValue}>{fmtBRLZero(account.saldoDevedor)}</Text>
        <Text style={styles.colValue}>{fmtBRLZero(account.saldoCredor)}</Text>
        <Text
          style={[
            styles.colValue,
            account.saldoLiquido < 0 && { color: '#dc2626' },
            account.saldoLiquido > 0 && { color: '#059669' },
          ]}
        >
          {fmtBRLZero(account.saldoLiquido)}
        </Text>
      </View>
    );
  };

  const renderSection = (
    title: string,
    sectionAccounts: BalanceteAccount[],
    total: number,
    totalLabel: string,
  ) => (
    <>
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>
        {title} ({sectionAccounts.length} contas)
      </Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.colCode, { fontWeight: 'bold' }]}>Código</Text>
        <Text style={[styles.colName, { fontWeight: 'bold' }]}>Conta</Text>
        <Text style={[styles.colValue, { fontWeight: 'bold' }]}>Devedor</Text>
        <Text style={[styles.colValue, { fontWeight: 'bold' }]}>Credor</Text>
        <Text style={[styles.colValue, { fontWeight: 'bold' }]}>Saldo</Text>
      </View>
      {sectionAccounts.length === 0 ? (
        <View style={{ padding: 12, backgroundColor: '#f8fafc', borderRadius: 4 }}>
          <Text style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center' }}>
            Nenhuma conta neste grupo
          </Text>
        </View>
      ) : (
        sectionAccounts.map((acc, idx) => renderAccountRow(acc, idx))
      )}
      <View style={[styles.totalRow, dynamicStyles.totalRow]}>
        <Text style={styles.totalLabel}>{totalLabel}</Text>
        <Text style={styles.totalValue}>{fmtBRLZero(total)}</Text>
      </View>
    </>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={[styles.header, dynamicStyles.headerBorder]}>
          <View>
            <Text style={styles.logo}>
              Conta <Text style={dynamicStyles.logoAccent}>Certa</Text>
            </Text>
            <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>
              Soluções Empresariais
            </Text>
          </View>
          <View style={styles.meta}>
            <Text>Relatório gerado em:</Text>
            <Text style={{ fontWeight: 'bold' }}>
              {new Date().toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>

        {/* TÍTULO */}
        <Text style={styles.title}>Balancete Patrimonial</Text>
        <Text style={styles.subtitle}>
          Posição em {periodLabel} • Referência: {period}
        </Text>

        {/* INFO DO CLIENTE */}
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{companyName}</Text>
          {cnpj && <Text style={styles.clientDetail}>CNPJ: {cnpj}</Text>}
          <Text style={styles.clientDetail}>
            Base de cálculo: lançamentos contábeis até {period}
          </Text>
        </View>

        {/* ATIVO */}
        {renderSection('ATIVO', ativoAccounts, totalAtivo, 'Total do Ativo')}

        {/* PASSIVO */}
        {renderSection('PASSIVO', passivoAccounts, totalPassivo, 'Total do Passivo')}

        {/* PATRIMÔNIO LÍQUIDO */}
        {renderSection(
          'PATRIMÔNIO LÍQUIDO',
          plAccounts,
          totalPL,
          'Total do Patrimônio Líquido',
        )}

        {/* EQUAÇÃO PATRIMONIAL */}
        <View
          style={{
            marginTop: 24,
            padding: 12,
            backgroundColor: '#f0fdfa',
            border: `1px solid ${primaryColor}33`,
            borderRadius: 4,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 10, color: '#475569' }}>
              Ativo Total:
            </Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#059669' }}>
              {fmtBRLZero(totalAtivo)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 10, color: '#475569' }}>
              (=) Passivo + PL:
            </Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#059669' }}>
              {fmtBRLZero(totalPassivo + totalPL)}
            </Text>
          </View>
          <View
            style={{
              borderTop: '1px solid #cbd5e1',
              paddingTop: 4,
              marginTop: 4,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0f172a' }}>
              Diferença (deve ser zero):
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: 'bold',
                color: Math.abs(totalAtivo - (totalPassivo + totalPL)) < 0.01 ? '#059669' : '#dc2626',
              }}
            >
              {fmtBRLZero(totalAtivo - (totalPassivo + totalPL))}
            </Text>
          </View>
        </View>

        {/* RODAPÉ */}
        <Text style={styles.footer}>
          {officeName} {officeCnpj ? `• CNPJ ${officeCnpj}` : ''}
          {'\n'}
          Documento gerado eletronicamente pelo sistema Radar Conta Certa
        </Text>
      </Page>
    </Document>
  );
};