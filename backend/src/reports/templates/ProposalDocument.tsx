// =================================================================
// ARQUIVO: backend/src/reports/templates/ProposalDocument.ts
// =================================================================
// Template de Proposta Comercial White-Label
// Versão sem JSX para compatibilidade com tsconfig do NestJS
// =================================================================
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  cover: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  logo: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  logoAccent: { fontSize: 32, fontWeight: 'bold' },
  tagline: { fontSize: 12, color: '#64748b', marginBottom: 40 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  client: { fontSize: 14, color: '#475569', marginBottom: 8 },
  date: { fontSize: 11, color: '#94a3b8' },
  section: { marginTop: 24 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    padding: '6 10',
    borderRadius: 4,
    color: 'white',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#334155',
    marginBottom: 8,
    textAlign: 'justify',
  },
  priceBox: {
    marginTop: 24,
    padding: 20,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    border: '2px solid',
    textAlign: 'center',
  },
  priceLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase' },
  priceValue: { fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
  },
});

export interface ProposalDocumentProps {
  proposalNumber: string;
  clientName: string;
  clientCnpj?: string;
  basePrice: number;
  aboutOffice?: string;
  differentials?: string;
  commercialTerms?: string;
  primaryColor: string;
  secondaryColor: string;
  officeName: string;
}

export const ProposalDocument: React.FC<ProposalDocumentProps> = ({
  proposalNumber,
  clientName,
  clientCnpj,
  basePrice,
  aboutOffice,
  differentials,
  commercialTerms,
  primaryColor,
  secondaryColor,
  officeName,
}) => {
  const dynamicStyles = StyleSheet.create({
    logoAccent: { color: secondaryColor },
    sectionTitle: { backgroundColor: primaryColor },
    priceBox: { borderColor: primaryColor },
    priceValue: { color: primaryColor },
  });

  const fmtBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return React.createElement(
    Document,
    null,
    
    // CAPA
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(
        View,
        { style: styles.cover },
        React.createElement(
          Text,
          { style: styles.logo },
          'Conta ',
          React.createElement(Text, { style: dynamicStyles.logoAccent }, 'Certa')
        ),
        React.createElement(Text, { style: styles.tagline }, 'Soluções Empresariais'),
        React.createElement(Text, { style: styles.title }, 'Proposta Comercial'),
        React.createElement(Text, { style: styles.client }, clientName),
        clientCnpj && React.createElement(
          Text,
          { style: styles.client },
          `CNPJ: ${clientCnpj}`
        ),
        React.createElement(
          Text,
          { style: styles.date },
          `Proposta nº ${proposalNumber} • ${new Date().toLocaleDateString('pt-BR')}`
        )
      )
    ),

    // CONTEÚDO
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      
      aboutOffice && React.createElement(
        View,
        { style: styles.section },
        React.createElement(
          Text,
          { style: [styles.sectionTitle, dynamicStyles.sectionTitle] },
          `Sobre ${officeName}`
        ),
        React.createElement(Text, { style: styles.paragraph }, aboutOffice)
      ),

      differentials && React.createElement(
        View,
        { style: styles.section },
        React.createElement(
          Text,
          { style: [styles.sectionTitle, dynamicStyles.sectionTitle] },
          'Nossos Diferenciais'
        ),
        React.createElement(Text, { style: styles.paragraph }, differentials)
      ),

      commercialTerms && React.createElement(
        View,
        { style: styles.section },
        React.createElement(
          Text,
          { style: [styles.sectionTitle, dynamicStyles.sectionTitle] },
          'Termos Comerciais'
        ),
        React.createElement(Text, { style: styles.paragraph }, commercialTerms)
      ),

      // INVESTIMENTO
      React.createElement(
        View,
        { style: [styles.priceBox, dynamicStyles.priceBox] },
        React.createElement(Text, { style: styles.priceLabel }, 'Investimento Mensal'),
        React.createElement(
          Text,
          { style: [styles.priceValue, dynamicStyles.priceValue] },
          fmtBRL(basePrice)
        ),
        React.createElement(
          Text,
          { style: { fontSize: 9, color: '#64748b', marginTop: 4 } },
          '* Valores sujeitos a revisão anual'
        )
      ),

      React.createElement(
        Text,
        { style: styles.footer },
        `${officeName} • Documento confidencial`
      )
    )
  );
};