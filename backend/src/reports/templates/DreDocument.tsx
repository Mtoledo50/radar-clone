// =================================================================
// ARQUIVO: backend/src/reports/templates/DreDocument.ts
// =================================================================
// Template do DRE (Demonstração do Resultado do Exercício)
// White-label: usa cores do tenant (Company.primaryColor)
// Versão sem JSX para compatibilidade com tsconfig do NestJS
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

// Registra fonte (Helvetica é nativa)
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
    fontSize: 10,
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
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoAccent: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  meta: {
    textAlign: 'right',
    fontSize: 9,
    color: '#64748b',
  },
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
  clientName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 9,
    color: '#64748b',
  },
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottom: '0.5px solid #e2e8f0',
  },
  rowLabel: {
    flex: 1,
    fontSize: 10,
    paddingLeft: 8,
  },
  rowValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 10,
    fontWeight: 'bold',
    paddingRight: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 8,
    borderTop: '2px solid',
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
  },
  totalLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: 'bold',
    paddingLeft: 8,
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: 'bold',
    paddingRight: 8,
  },
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
  if (v === 0) return 'R$ 0,00';
  const abs = Math.abs(v);
  const formatted = abs.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return v < 0 ? `(R$ ${formatted})` : `R$ ${formatted}`;
};

// =================================================================
// COMPONENTE PRINCIPAL (usando React.createElement)
// =================================================================
export interface DreDocumentProps {
  companyName: string;
  cnpj?: string;
  period: string;
  periodLabel: string;
  receitas: number;
  despesas: number;
  resultado: number;
  margem: number;
  primaryColor: string;
  secondaryColor: string;
  officeName: string;
  officeCnpj?: string;
}

export const DreDocument: React.FC<DreDocumentProps> = ({
  companyName,
  cnpj,
  period,
  periodLabel,
  receitas,
  despesas,
  resultado,
  margem,
  primaryColor,
  secondaryColor,
  officeName,
  officeCnpj,
}) => {
  const dynamicStyles = StyleSheet.create({
    headerBorder: { borderBottomColor: primaryColor },
    sectionTitle: {
      ...styles.sectionTitle,
      backgroundColor: primaryColor,
    },
    totalRow: {
      ...styles.totalRow,
      borderTopColor: secondaryColor,
    },
    totalValuePositive: {
      ...styles.totalValue,
      color: resultado >= 0 ? '#059669' : '#dc2626',
    },
    logoAccent: {
      ...styles.logoAccent,
      color: secondaryColor,
    },
  });

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      
      // HEADER
      React.createElement(
        View,
        { style: [styles.header, dynamicStyles.headerBorder] },
        React.createElement(
          View,
          null,
          React.createElement(
            Text,
            { style: styles.logo },
            'Conta ',
            React.createElement(Text, { style: dynamicStyles.logoAccent }, 'Certa')
          ),
          React.createElement(
            Text,
            { style: { fontSize: 8, color: '#64748b', marginTop: 2 } },
            'Soluções Empresariais'
          )
        ),
        React.createElement(
          View,
          { style: styles.meta },
          React.createElement(Text, null, 'Relatório gerado em:'),
          React.createElement(
            Text,
            { style: { fontWeight: 'bold' } },
            new Date().toLocaleDateString('pt-BR')
          )
        )
      ),

      // TÍTULO
      React.createElement(
        Text,
        { style: styles.title },
        'Demonstração do Resultado do Exercício'
      ),
      React.createElement(
        Text,
        { style: styles.subtitle },
        `Período de referência: ${periodLabel}`
      ),

      // INFO DO CLIENTE
      React.createElement(
        View,
        { style: styles.clientInfo },
        React.createElement(
          Text,
          { style: styles.clientName },
          companyName
        ),
        cnpj && React.createElement(
          Text,
          { style: styles.clientDetail },
          `CNPJ: ${cnpj}`
        ),
        React.createElement(
          Text,
          { style: styles.clientDetail },
          `Período: ${period}`
        )
      ),

      // RECEITAS
      React.createElement(
        Text,
        { style: [styles.sectionTitle, dynamicStyles.sectionTitle] },
        '(+) Receitas'
      ),
      React.createElement(
        View,
        { style: styles.row },
        React.createElement(Text, { style: styles.rowLabel }, 'Receita Operacional Bruta'),
        React.createElement(Text, { style: styles.rowValue }, fmtBRL(receitas))
      ),
      React.createElement(
        View,
        { style: [styles.totalRow, dynamicStyles.totalRow] },
        React.createElement(Text, { style: styles.totalLabel }, 'Total de Receitas'),
        React.createElement(Text, { style: styles.totalValue }, fmtBRL(receitas))
      ),

      // DESPESAS
      React.createElement(
        Text,
        { style: [styles.sectionTitle, dynamicStyles.sectionTitle] },
        '(-) Despesas'
      ),
      React.createElement(
        View,
        { style: styles.row },
        React.createElement(Text, { style: styles.rowLabel }, 'Despesas Operacionais'),
        React.createElement(Text, { style: styles.rowValue }, fmtBRL(despesas))
      ),
      React.createElement(
        View,
        { style: [styles.totalRow, dynamicStyles.totalRow] },
        React.createElement(Text, { style: styles.totalLabel }, 'Total de Despesas'),
        React.createElement(Text, { style: styles.totalValue }, fmtBRL(despesas))
      ),

      // RESULTADO
      React.createElement(
        Text,
        { style: [styles.sectionTitle, dynamicStyles.sectionTitle] },
        '(=) Resultado do Exercício'
      ),
      React.createElement(
        View,
        { style: [styles.totalRow, dynamicStyles.totalRow] },
        React.createElement(Text, { style: styles.totalLabel }, 'Resultado Líquido'),
        React.createElement(
          Text,
          { style: [styles.totalValue, dynamicStyles.totalValuePositive] },
          fmtBRL(resultado)
        )
      ),

      // MARGEM
      React.createElement(
        View,
        {
          style: {
            marginTop: 24,
            padding: 12,
            backgroundColor: '#f0fdfa',
            border: `1px solid ${primaryColor}33`,
            borderRadius: 4,
          },
        },
        React.createElement(
          View,
          { style: { flexDirection: 'row', justifyContent: 'space-between' } },
          React.createElement(
            Text,
            { style: { fontSize: 10, color: '#475569' } },
            'Margem de Lucro:'
          ),
          React.createElement(
            Text,
            {
              style: {
                fontSize: 14,
                fontWeight: 'bold',
                color: resultado >= 0 ? '#059669' : '#dc2626',
              },
            },
            `${margem.toFixed(1)}%`
          )
        )
      ),

      // RODAPÉ
      React.createElement(
        Text,
        { style: styles.footer },
        `${officeName}${officeCnpj ? ` • CNPJ ${officeCnpj}` : ''}\nDocumento gerado eletronicamente pelo sistema Radar Conta Certa`
      )
    )
  );
};