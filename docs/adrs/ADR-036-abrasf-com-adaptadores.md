# ADR-036: Parser de NFS-e ABRASF com Adaptadores por Prefeitura

**Data:** 2026-08  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O módulo Aurora (Funcionário Digital) precisa importar NFS-e (Nota Fiscal de Serviço eletrônica) de clientes do escritório. Diferente da NF-e (mercadoria), a NFS-e é **municipal**, e cada prefeitura tem seu próprio layout XML, schema e regras de validação.

**Problema:**
- Existem mais de 5.500 prefeituras no Brasil, cada uma com seu sistema de NFS-e
- Layouts XML variam drasticamente (campos opcionais, nomes diferentes, estruturas distintas)
- Não existe um padrão único nacional (como a NF-e da Receita Federal)
- O padrão mais comum é ABRASF 2.0 (Associação Brasileira das Secretarias de Finanças), mas há variações

**Dilema:**
Como suportar múltiplos layouts de NFS-e sem criar um parser gigante e frágil para cada prefeitura?

---

## 🎯 Decisão

Implementar um **parser base ABRASF 2.0** com **adaptadores específicos** para prefeituras que desviam do padrão. A arquitetura segue o padrão **Strategy**, onde cada adaptador implementa uma interface comum `NfseParser`.

### Regras:

1. **Parser Base ABRASF 2.0:**
   - Suporta 80% das prefeituras que seguem o padrão
   - Extrai campos obrigatórios: número, data de emissão, valor do serviço, tomador, prestador
   - Valida schema XSD da ABRASF

2. **Adaptadores Específicos:**
   - Para prefeituras que usam layouts customizados (ex: São Paulo, Rio de Janeiro, Belo Horizonte)
   - Cada adaptador sobrescreve métodos específicos do parser base
   - Registrados em um `NfseParserFactory` que detecta a prefeitura pelo namespace do XML

3. **Detecção Automática:**
   - O parser analisa o namespace do XML (`<ns1:CompNfse xmlns:ns1="...">`)
   - Com base no namespace, seleciona o adaptador correto
   - Se não houver adaptador específico, usa o parser base ABRASF

4. **Fallback para XML Desconhecido:**
   - Se o namespace não for reconhecido, o sistema tenta o parser base
   - Se falhar, marca a NFS-e como `status = FAILED` com `errorMessage` detalhada
   - Usuário pode fazer upload manual dos campos (revisão humana)

5. **Idempotência:**
   - NFS-e identificada por `accessKey` (chave única de 44 caracteres)
   - Reimportar a mesma NFS-e não duplica (upsert por `accessKey`)

---

## 💡 Implementação

### Backend: Interface do Parser

```typescript
// backend/src/fiscal/domain/nfse-parser.interface.ts

export interface NfseData {
  accessKey: string; // Chave única de 44 caracteres
  number: string; // Número da NFS-e
  issueDate: Date; // Data de emissão
  serviceValue: number; // Valor do serviço
  issValue?: number; // Valor do ISS (se destacado)
  borrower: {
    name: string;
    cnpjCpf: string;
    city?: string;
  };
  provider: {
    name: string;
    cnpj: string;
  };
  serviceDescription: string;
  itemListCode?: string; // Código do serviço (LC 116/2003)
}

export interface NfseParser {
  /**
   * Verifica se este parser suporta o XML fornecido
   */
  canParse(xmlContent: string): boolean;

  /**
   * Extrai dados da NFS-e do XML
   */
  parse(xmlContent: string): NfseData;
}

Backend: Parser Base ABRASF 2.0

// backend/src/fiscal/domain/parsers/abrasf-2-0-parser.ts

import { XMLParser } from 'fast-xml-parser';
import { NfseParser, NfseData } from '../nfse-parser.interface';

export class Abrasf20Parser implements NfseParser {
  private xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  canParse(xmlContent: string): boolean {
    // Detecta namespace ABRASF 2.0
    return xmlContent.includes('http://www.abrasf.org.br/nfse.xsd');
  }

  parse(xmlContent: string): NfseData {
    const parsed = this.xmlParser.parse(xmlContent);

    // Navegar até o nó CompNfse (estrutura ABRASF)
    const compNfse = parsed.CompNfse?.Nfse?.InfNfse;
    if (!compNfse) {
      throw new Error('XML não segue estrutura ABRASF 2.0 (nó InfNfse não encontrado)');
    }

    // Extrair campos
    const accessKey = compNfse '@_Id' || this.generateAccessKey(compNfse);
    const number = compNfse.Numero.toString();
    const issueDate = this.parseDate(compNfse.DataEmissao);
    const serviceValue = parseFloat(compNfse.Servico.Valores.ValorServicos);

    // Tomador (borrower)
    const tomador = compNfse.Tomador?.DadosTomador?.IdentificacaoTomador;
    const borrower = {
      name: tomador?.RazaoSocial || 'Não informado',
      cnpjCpf: tomador?.CpfCnpj?.Cnpj || tomador?.CpfCnpj?.Cpf || '',
      city: tomador?.Endereco?.Municipio,
    };

    // Prestador (provider)
    const prestador = compNfse.Prestador?.DadosPrestador?.IdentificacaoPrestador;
    const provider = {
      name: prestador?.RazaoSocial || 'Não informado',
      cnpj: prestador?.Cnpj || '',
    };

    return {
      accessKey,
      number,
      issueDate,
      serviceValue,
      issValue: compNfse.Servico.Valores.ValorIss ? parseFloat(compNfse.Servico.Valores.ValorIss) : undefined,
      borrower,
      provider,
      serviceDescription: compNfse.Servico.Discriminacao || '',
      itemListCode: compNfse.Servico.CodigoTributacaoMunicipio,
    };
  }

  private parseDate(dateStr: string): Date {
    // ABRASF usa formato YYYY-MM-DD
    return new Date(dateStr);
  }

  private generateAccessKey(nfse: any): string {
    // Se o XML não tem @Id, gerar chave única baseada em dados
    const cnpj = nfse.Prestador.DadosPrestador.IdentificacaoPrestador.Cnpj;
    const number = nfse.Numero;
    const date = nfse.DataEmissao.replace(/-/g, '');
    return `${cnpj}${number}${date}`.padEnd(44, '0');
  }
}

Backend: Adaptador para São Paulo

// backend/src/fiscal/domain/parsers/sao-paulo-parser.ts

import { Abrasf20Parser } from './abrasf-2-0-parser';
import { NfseData } from '../nfse-parser.interface';

/**
 * Adaptador para NFS-e de São Paulo (layout customizado)
 * São Paulo usa namespace próprio e campos diferentes do ABRASF padrão
 */
export class SaoPauloParser extends Abrasf20Parser {
  canParse(xmlContent: string): boolean {
    return xmlContent.includes('http://www.prefeitura.sp.gov.br/nfse');
  }

  parse(xmlContent: string): NfseData {
    // Chamar parser base para extrair campos comuns
    const baseData = super.parse(xmlContent);

    // Sobrescrever campos específicos de São Paulo
    const parsed = this.xmlParser.parse(xmlContent);
    const nfseSP = parsed.NFSE?.ChaveNFe;

    // São Paulo usa "CodigoVerificacao" em vez de "Id"
    baseData.accessKey = nfseSP || baseData.accessKey;

    // São Paulo tem campo "Discriminacao" em outro nó
    baseData.serviceDescription = parsed.NFSE?.Servico?.Discriminacao || baseData.serviceDescription;

    return baseData;
  }
}

Backend: Factory de Parsers

// backend/src/fiscal/domain/parsers/nfse-parser-factory.ts

import { NfseParser } from '../nfse-parser.interface';
import { Abrasf20Parser } from './abrasf-2-0-parser';
import { SaoPauloParser } from './sao-paulo-parser';

export class NfseParserFactory {
  private parsers: NfseParser[] = [
    new SaoPauloParser(), // Adaptadores específicos primeiro
    new Abrasf20Parser(), // Parser base como fallback
  ];

  /**
   * Seleciona o parser adequado para o XML fornecido
   */
  getParser(xmlContent: string): NfseParser {
    for (const parser of this.parsers) {
      if (parser.canParse(xmlContent)) {
        return parser;
      }
    }

    // Se nenhum parser específico funcionar, usar o base
    return this.parsers[this.parsers.length - 1];
  }
}

Backend: Serviço de Importação

// backend/src/fiscal/services/nfse-import.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NfseParserFactory } from '../domain/parsers/nfse-parser-factory';

@Injectable()
export class NfseImportService {
  private readonly logger = new Logger(NfseImportService.name);
  private parserFactory = new NfseParserFactory();

  constructor(private prisma: PrismaService) {}

  async importXml(companyId: string, clientId: string, xmlContent: string) {
    try {
      // 1. Selecionar parser adequado
      const parser = this.parserFactory.getParser(xmlContent);

      // 2. Extrair dados
      const nfseData = parser.parse(xmlContent);

      // 3. Upsert (idempotente por accessKey)
      const nfse = await this.prisma.fiscalServiceInvoice.upsert({
        where: {
          companyId_accessKey: {
            companyId,
            accessKey: nfseData.accessKey,
          },
        },
        update: {
          // Atualizar apenas se já existir (ex: status mudou)
          status: 'PROCESSED',
          processedAt: new Date(),
        },
        create: {
          companyId,
          clientId,
          accessKey: nfseData.accessKey,
          number: nfseData.number,
          issueDate: nfseData.issueDate,
          value: nfseData.serviceValue,
          issValue: nfseData.issValue,
          borrowerName: nfseData.borrower.name,
          borrowerCnpjCpf: nfseData.borrower.cnpjCpf,
          providerName: nfseData.provider.name,
          providerCnpj: nfseData.provider.cnpj,
          serviceDescription: nfseData.serviceDescription,
          itemListCode: nfseData.itemListCode,
          source: 'MANUAL', // ADR-037
          status: 'PROCESSED',
          processedAt: new Date(),
        },
      });

      this.logger.log(`NFS-e ${nfseData.number} importada com sucesso para cliente ${clientId}`);

      return {
        success: true,
        nfseId: nfse.id,
        number: nfseData.number,
        value: nfseData.serviceValue,
      };
    } catch (error) {
      this.logger.error(`Falha ao importar NFS-e: ${error.message}`);

      // Registrar falha para auditoria
      await this.prisma.fiscalServiceInvoice.create({
        data: {
          companyId,
          clientId,
          accessKey: `FAILED_${Date.now()}`, // Chave temporária
          number: 'ERRO',
          issueDate: new Date(),
          value: 0,
          source: 'MANUAL',
          status: 'FAILED',
          errorMessage: error.message,
        },
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }
}
Backend: Schema Prisma

// backend/prisma/schema.prisma

model FiscalServiceInvoice {
  id              String   @id @default(uuid())
  companyId       String
  clientId        String
  
  // Identificação única
  accessKey       String   @unique // Chave de 44 caracteres (ou FAILED_timestamp)
  number          String
  issueDate       DateTime
  value           Decimal  @db.Decimal(14, 2)
  issValue        Decimal? @db.Decimal(14, 2)
  
  // Tomador (borrower)
  borrowerName    String
  borrowerCnpjCpf String
  borrowerCity    String?
  
  // Prestador (provider)
  providerName    String
  providerCnpj    String
  
  // Serviço
  serviceDescription String  @db.Text
  itemListCode    String? // Código LC 116/2003
  
  // Origem e processamento (ADR-037)
  source          DocumentSource @default(MANUAL)
  status          String   @default("PENDING") // PENDING | PROCESSED | FAILED
  errorMessage    String?  @db.Text
  processedAt     DateTime?
  
  createdAt       DateTime @default(now())
  
  company         Company  @relation(fields: [companyId], references: [id])
  client          Client   @relation(fields: [clientId], references: [id])
  
  @@index([companyId, clientId, issueDate])
  @@index([companyId, accessKey])
  @@map("fiscal_service_invoices")
}

enum DocumentSource {
  MANUAL
  EMAIL
  FOLDER
  PORTAL
  API
  IMPORT
  SYSTEM
}

Frontend: Upload de NFS-e

// frontend/src/app/dashboard/fiscal/nfse/page.tsx

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function NfsePage() {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    let success = 0;
    let failed = 0;

    for (const file of Array.from(files)) {
      const xmlContent = await file.text();
      
      try {
        const res = await api.post('/fiscal/nfse/import', {
          clientId: 'selected-client-id', // Do contexto
          xmlContent,
        });

        if (res.data.success) {
          success++;
          toast.success(`NFS-e ${res.data.number} importada`);
        } else {
          failed++;
          toast.error(`Falha: ${res.data.error}`);
        }
      } catch (error) {
        failed++;
        toast.error('Erro ao importar NFS-e');
      }
    }

    setUploading(false);
    toast.info(`Importação concluída: ${success} sucesso, ${failed} falhas`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">NFS-e (Nota Fiscal de Serviço)</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <label className="block">
          <span className="text-gray-700 font-medium">Upload de XML (múltiplos arquivos)</span>
          <input
            type="file"
            accept=".xml"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
          />
        </label>

        {uploading && (
          <div className="mt-4 text-center text-gray-600">
            Processando NFS-e...
          </div>
        )}
      </div>
    </div>
  );
}

✅ Consequências

Positivas

✅ Extensibilidade: Fácil adicionar adaptadores para novas prefeituras
✅ Manutenibilidade: Parser base cobre 80% dos casos, adaptadores apenas para exceções
✅ Detecção Automática: Usuário não precisa selecionar manualmente o layout
✅ Idempotência: Reimportar não duplica (upsert por accessKey)

Negativas

❌ Complexidade Inicial: Exige entender a estrutura ABRASF e variações
❌ Testes por Prefeitura: Cada adaptador exige XMLs reais para testes
❌ Prefeituras Obscuras: Algumas prefeituras usam layouts tão customizados que exigem adaptadores específicos (custo de desenvolvimento)

📚 Referências

Arquivos que usam esta ADR:

backend/src/fiscal/domain/nfse-parser.interface.ts
backend/src/fiscal/domain/parsers/abrasf-2-0-parser.ts
backend/src/fiscal/domain/parsers/sao-paulo-parser.ts
backend/src/fiscal/domain/parsers/nfse-parser-factory.ts
backend/src/fiscal/services/nfse-import.service.ts
frontend/src/app/dashboard/fiscal/nfse/page.tsx

ADRs relacionadas:

ADR-037 (source como atributo de origem)
ADR-039 (IMAP como coletor de NFS-e)
ADR-066/067 (Idempotência via upsert)

Bibliotecas Utilizadas:

fast-xml-parser: Parser de XML tolerante a namespaces (https://github.com/NaturalIntelligence/fast-xml-parser)

🔄 Histórico de Revisões

Data            Autor               Mudança
2026-08         Marcos Toledo       Criação inicial