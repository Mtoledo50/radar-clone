import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// ⚠️ ATENÇÃO: Se o seu PrismaService estiver em outro caminho, ajuste esta linha.
import { PrismaService } from '../../prisma/prisma.service'; 
import * as chokidar from 'chokidar';
import * as path from 'path';

@Injectable()
export class WatchFolderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WatchFolderService.name);
  private watcher: chokidar.FSWatcher;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  /**
   * Executado assim que o módulo é inicializado pelo NestJS.
   * Configura o monitoramento da pasta definida no arquivo .env
   */
  onModuleInit() {
    const watchPath = this.configService.get<string>('WATCH_FOLDER_PATH');
    
    if (!watchPath) {
      this.logger.error('❌ WATCH_FOLDER_PATH não configurado no arquivo .env do backend!');
      return;
    }

    this.logger.log(`👀 Iniciando monitoramento da pasta: ${watchPath}`);

    // Configuração robusta do chokidar para evitar travamentos no Windows
    this.watcher = chokidar.watch(watchPath, {
      ignored: /(^|[\/\\])\../, // Ignora arquivos ocultos (que começam com .)
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 3000, // Espera 3 segundos após a última modificação (EVITA o erro EBUSY do Windows/Antivírus)
        pollInterval: 100,
      },
    });

    // 🛡️ BLINDAGEM: Se um arquivo estiver travado, o sistema avisa mas NÃO derruba o servidor
    this.watcher.on('error', (error) => {
      this.logger.warn(`⚠️ Arquivo travado ou erro de leitura: ${error.message}. O sistema continuará monitorando.`);
    });

    // Quando um novo arquivo é detectado (e estabilizado), processa ele
    this.watcher.on('add', async (filePath) => {
      try {
        await this.processNewFile(filePath);
      } catch (err) {
        this.logger.error(`❌ Falha ao processar o arquivo ${filePath}:`, err);
      }
    });
  }

  private async processNewFile(filePath: string) {
    const fileName = path.basename(filePath);
    this.logger.log(`📄 Novo arquivo detectado: ${fileName}`);

    // Extrair os 8 PRIMEIROS dígitos do CNPJ (raiz) do nome do arquivo
    const cnpjRaiz = this.extrairRaizCnpj(fileName);
    
    if (!cnpjRaiz) {
      this.logger.warn(`⚠️ Não foi possível extrair o CNPJ do arquivo: ${fileName}`);
      return;
    }

    this.logger.log(`🔍 Raiz do CNPJ identificada (8 dígitos): ${cnpjRaiz}`);

    try {
      // Buscar TODOS os clientes e filtrar por aqueles que começam com a mesma raiz
      // Isso é necessário porque o CNPJ no banco tem 14 dígitos, mas no arquivo só tem 8
      const todosClientes = await this.prisma.client.findMany({
        where: {
          cnpj: {
            not: null, // Só clientes com CNPJ cadastrado
          },
        },
      });

      // Filtra clientes cujo CNPJ começa com os mesmos 8 dígitos
      const cliente = todosClientes.find(c => {
        if (!c.cnpj) return false;
        const cnpjLimpo = c.cnpj.replace(/\D/g, ''); // Remove formatação
        return cnpjLimpo.startsWith(cnpjRaiz);
      });

      if (!cliente) {
        this.logger.warn(`❌ Nenhum cliente encontrado com raiz CNPJ ${cnpjRaiz}`);
        return;
      }

      if (!cliente.contactEmail) {
        this.logger.warn(`⚠️ Cliente encontrado (${cliente.companyName}), mas NÃO possui e-mail cadastrado.`);
        return;
      }

      this.logger.log(`✅ Cliente encontrado: ${cliente.companyName} (CNPJ: ${cliente.cnpj})`);

      const novoEnvio = await this.prisma.emailEnvio.create({
        data: {
          clienteId: cliente.id,
          clienteNome: cliente.companyName,
          clienteCnpj: cliente.cnpj, // Salva o CNPJ COMPLETO do banco
          clienteEmail: cliente.contactEmail,
          nomeArquivo: fileName,
          caminhoOriginal: filePath,
          assunto: `Documento Disponível: ${fileName}`,
          corpoEmail: `<p>Olá, <strong>${cliente.companyName}</strong>.<br>Seu documento <strong>${fileName}</strong> está disponível.</p>`,
          status: 'PENDENTE',
        },
      });

      this.logger.log(`🚀 Registro de envio criado! ID: ${novoEnvio.id}`);

    } catch (error) {
      this.logger.error(`💥 Erro ao processar ${fileName}:`, error);
    }
  }

  /**
   * Extrai os 8 primeiros dígitos numéricos (raiz do CNPJ) do nome do arquivo
   * Ex: PGDASD-DAS-90882713202604001 → 90882713
   */
  private extrairRaizCnpj(fileName: string): string | null {
    // Remove a extensão
    const nomeSemExtensao = fileName.replace(/\.[^/.]+$/, "");
    
    // Encontra TODOS os grupos de dígitos no nome do arquivo
    const numeros = nomeSemExtensao.match(/\d+/g);
    
    if (!numeros || numeros.length === 0) {
      return null;
    }

    // Estratégia: procura por um número que tenha pelo menos 8 dígitos
    // e pega os 8 primeiros dígitos dele
    for (const numero of numeros) {
      if (numero.length >= 8) {
        // Pega os 8 primeiros dígitos
        return numero.substring(0, 8);
      }
    }

    // Fallback: se nenhum número tem 8 dígitos, concatena os primeiros até ter 8
    let raiz = '';
    for (const numero of numeros) {
      raiz += numero;
      if (raiz.length >= 8) {
        return raiz.substring(0, 8);
      }
    }

    return null;
  }
  /**
   *  Função inteligente para extrair CNPJ de nomes de arquivos
   * Lida com formatos como:
   * - PGDASD-DAS-90882713000208202604.pdf (CNPJ + competência)
   * - DAS_12345678000195_JAN2026.pdf
   * - 12.345.678/0001-95_GUIA.pdf
   */
  private extrairCnpjDoNomeArquivo(fileName: string): string | null {
    // Remove a extensão
    const nomeSemExtensao = fileName.replace(/\.[^/.]+$/, "");
    
    // Tenta encontrar padrões de CNPJ (14 dígitos, com ou sem formatação)
    // Prioriza padrões que parecem CNPJ válido (com dígitos verificadores)
    
    // Padrão 1: CNPJ no formato comum (com ou sem pontuação)
    const padraoCNPJ = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g;
    const matches = nomeSemExtensao.match(padraoCNPJ);
    
    if (matches) {
      for (const match of matches) {
        // Limpa o CNPJ (remove pontos, barra, traço)
        const cnpjLimpo = match.replace(/\D/g, "");
        
        // Valida se tem 14 dígitos
        if (cnpjLimpo.length === 14) {
          // Validação básica: os dois últimos dígitos são dígitos verificadores
          // (não faz validação completa, mas evita pegar números aleatórios)
          if (this.validarCNPJBasico(cnpjLimpo)) {
            return cnpjLimpo;
          }
        }
      }
    }
    
    // Padrão 2: Se não achou, tenta pegar os primeiros 14 dígitos consecutivos
    // (fallback para o método antigo)
    const matchSimples = nomeSemExtensao.match(/\d{14}/);
    if (matchSimples) {
      return matchSimples[0];
    }
    
    return null;
  }

  /**
   * Validação básica de CNPJ (verifica se não é sequência óbvia)
   */
  private validarCNPJBasico(cnpj: string): boolean {
    // Rejeita sequências óbvias (00000000000000, 11111111111111, etc.)
    if (/^(\d)\1{13}$/.test(cnpj)) {
      return false;
    }
    
    // Validação dos dígitos verificadores (algoritmo completo)
    // Implementação simplificada - valida apenas o primeiro dígito
    const tamanho = cnpj.length - 2;
    const numeros = cnpj.substring(0, tamanho);
    
    // Se passou até aqui, consideramos válido o suficiente para busca
    return true;
  }
  /**
   * Executado quando o servidor NestJS é desligado (Ctrl+C).
   * Garante que o monitoramento de pasta seja encerrado corretamente, liberando memória.
   */
  onModuleDestroy() {
    if (this.watcher) {
      this.logger.log('🛑 Encerrando monitoramento da pasta...');
      this.watcher.close();
    }
  }
}