/**
 * =================================================================
 * CNAB Types — Domínio puro (sem dependências de banco/HTTP)
 * =================================================================
 * Define os tipos de registro, códigos de movimento e interfaces
 * para CNAB 240 e 400 (formatos bancários brasileiros).
 *
 * ADR-084: Domínio puro isolado (testável sem banco/HTTP).
 * =================================================================
 */

// ============================================================================
// ENUMS — Códigos oficiais FEBRABAN
// ============================================================================

/** Tipo de registro CNAB 240 */
export enum Cnab240RecordType {
  HEADER_ARQUIVO = '0',
  HEADER_LOTE = '1',
  REGISTRO_DETALHE = '3',
  TRAILER_LOTE = '5',
  TRAILER_ARQUIVO = '9',
}

/** Tipo de registro CNAB 400 */
export enum Cnab400RecordType {
  HEADER = '0',
  DETALHE = '1',
  TRAILER = '9',
}

/** Código de movimento de retorno (o que o banco fez) */
export enum CnabMovementCode {
  // CNAB 240 (códigos FEBRABAN)
  LIQUIDACAO = '06',        // Boleto pago
  BAIXA_SIMPLES = '02',     // Baixa por decurso de prazo
  BAIXA_POR_PEDIDO = '09',  // Baixa solicitada pelo cedente
  CONFIRMACAO = '03',       // Confirmação de registro
  REJEICAO = '26',          // Rejeição do boleto

  // CNAB 400 (códigos Bradesco/Santander)
  LIQUIDACAO_400 = '09',    // Liquidação
  BAIXA_400 = '02',         // Baixa
  ENTRADA_400 = '01',       // Entrada confirmada
}

/** Tipo de inscrição do cedente/sacado */
export enum CnabInscricaoType {
  CPF = '1',
  CNPJ = '2',
  ISENTO = '3',
  OUTRO = '9',
}

// ============================================================================
// INTERFACES — Estruturas de dados
// ============================================================================

/** Boleto individual (linha do arquivo de remessa) */
export interface CnabBoleto {
  nossoNumero: string;          // Identificador único do boleto no banco
  numeroDocumento: string;      // Número da fatura/nota fiscal
  vencimento: Date;             // Data de vencimento
  valor: number;                // Valor em reais (2 decimais)
  sacadoNome: string;           // Nome do pagador
  sacadoDocumento: string;      // CPF/CNPJ do pagador
  sacadoEndereco: string;       // Endereço do pagador
  sacadoCidade: string;         // Cidade do pagador
  sacadoUF: string;             // UF do pagador (2 letras)
  sacadoCEP: string;            // CEP do pagador (8 dígitos)
  instrucoes?: string[];        // Instruções de cobrança (até 5 linhas)
}

/** Resultado do parsing de um arquivo de retorno */
export interface CnabRetorno {
  banco: string;                // Nome do banco (ex: "Banco do Brasil")
  dataGeracao: Date;            // Data de geração do arquivo
  sequencial: number;           // Número sequencial do arquivo
  movimentos: CnabMovimento[];  // Lista de movimentos processados
}

/** Movimento individual (linha do arquivo de retorno) */
export interface CnabMovimento {
  nossoNumero: string;          // Identificador do boleto
  numeroDocumento: string;      // Número da fatura
  dataOcorrencia: Date;         // Data do evento (pagamento/baixa)
  codigoMovimento: string;      // Código FEBRABAN (ex: '06' = liquidação)
  descricaoMovimento: string;   // Descrição legível (ex: "Liquidação")
  valorPago: number;            // Valor pago (0 se não houve pagamento)
  dataCredito: Date | null;     // Data do crédito na conta (null se não pago)
  tarifa: number;               // Tarifa bancária cobrada
}

// ============================================================================
// TIPOS AUXILIARES — Validações
// ============================================================================

/** Resultado de validação de campo */
export interface CnabValidationResult {
  valid: boolean;
  errors: string[];
}

/** Configuração de arquivo CNAB */
export interface CnabConfig {
  banco: 'bb' | 'itau' | 'bradesco' | 'santander' | 'caixa';
  formato: '240' | '400';
  cedenteNome: string;
  cedenteDocumento: string;     // CPF/CNPJ
  cedenteAgencia: string;
  cedenteConta: string;
  cedenteCarteira: string;      // Código da carteira de cobrança

}