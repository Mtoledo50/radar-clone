import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    // Configuração do transporte SMTP (Gmail, Outlook, etc.)
    // As credenciais vêm do arquivo .env do backend
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: parseInt(this.configService.get('SMTP_PORT') || '587'),
      secure: false, // true para porta 465 (SSL), false para 587 (TLS)
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  /**
   * 📬 PROCESSAR TODOS OS PENDENTES
   * Varre o banco de dados em busca de registros com status 'PENDENTE'
   * e os envia um a um. Se algum falhar, marca como 'FALHOU' e continua.
   */
  async processPendingEmails() {
    const pendentes = await this.prisma.emailEnvio.findMany({
      where: { status: 'PENDENTE' },
    });

    if (pendentes.length === 0) {
      this.logger.log('📬 Nenhum e-mail pendente para envio.');
      return;
    }

    this.logger.log(`📬 Encontrados ${pendentes.length} e-mail(s) pendente(s) para envio.`);

    for (const envio of pendentes) {
      try {
        await this.enviarEmailIndividual(envio);
      } catch (error: any) {
        this.logger.error(`❌ Falha ao enviar e-mail ID ${envio.id}: ${error.message}`);
        await this.prisma.emailEnvio.update({
          where: { id: envio.id },
          data: { status: 'FALHOU' },
        });
      }
    }
  }

  /**
   * 📤 ENVIAR REGISTRO INDIVIDUAL
   * Permite enviar apenas UM e-mail específico (usado pelo botão "Enviar" da tabela)
   */
  async enviarRegistroIndividual(id: string) {
    const envio = await this.prisma.emailEnvio.findUnique({
      where: { id: id },
    });

    if (!envio) {
      throw new Error('Registro não encontrado');
    }

    if (envio.status !== 'PENDENTE') {
      throw new Error(`Este e-mail já está com status: ${envio.status}`);
    }

    await this.enviarEmailIndividual(envio);
  }

  /**
   *  MÉTODO PRINCIPAL DE ENVIO
   * Faz todo o processo: valida arquivo, organiza pastas, move o arquivo,
   * monta o HTML com tracking e dispara o e-mail via SMTP.
   */
  private async enviarEmailIndividual(envio: any) {
    const sentFolderPath = this.configService.get<string>('SENT_FOLDER_PATH');
    const appUrl = this.configService.get<string>('APP_URL');

    // 🛡️ 1. VERIFICAÇÃO DE SEGURANÇA: O arquivo original ainda existe na pasta A_Processar?
    try {
      await fs.access(envio.caminhoOriginal);
    } catch (error) {
      this.logger.warn(`⚠️ Arquivo original NÃO encontrado: ${envio.caminhoOriginal}. Marcando como FALHOU.`);
      await this.prisma.emailEnvio.update({
        where: { id: envio.id },
        data: { status: 'FALHOU' },
      });
      return; // Interrompe o processamento deste registro específico
    }

    // 📁 2. ORGANIZAÇÃO INTELIGENTE DE PASTAS
    // Sanitiza o nome do cliente para ser um nome de pasta válido no Windows
    // Remove caracteres proibidos: \ / : * ? " < > |
    const clienteNomeSanitizado = envio.clienteNome
      .replace(/[\\/:*?"<>|]/g, '-')
      .trim();

    // Gera o código do período baseado na data atual (ex: "092026" para Setembro/2026)
    const agora = new Date();
    const mes = String(agora.getMonth() + 1).padStart(2, '0'); // +1 porque janeiro é 0
    const ano = String(agora.getFullYear());
    const periodoPasta = `${mes}${ano}`;

    // Monta o caminho completo: C:\...\Enviados\Nome do Cliente\MMYYYY
    const pastaDestino = path.join(sentFolderPath, clienteNomeSanitizado, periodoPasta);

    // Cria a estrutura de pastas automaticamente (recursive: true cria todas as subpastas necessárias)
    // Se as pastas já existirem, não dá erro — apenas ignora
    await fs.mkdir(pastaDestino, { recursive: true });
    this.logger.log(`📁 Pasta organizada: ${pastaDestino}`);

    // Define o caminho final do arquivo dentro da nova estrutura
    const caminhoFinal = path.join(pastaDestino, envio.nomeArquivo);

    // 3. MOVER O ARQUIVO FISICAMENTE
    // Move da pasta A_Processar para a pasta organizada do cliente
    try {
      await fs.rename(envio.caminhoOriginal, caminhoFinal);
    } catch (error) {
      this.logger.error(`Erro ao mover arquivo ${envio.nomeArquivo}. Verifique se não está aberto em outro programa.`, error);
      throw new Error('Falha ao mover arquivo');
    }

    // 4. MONTAR O HTML DO E-MAIL COM TRACKING
    // Link Proxy: quando o cliente clica, o sistema registra o download antes de entregar o arquivo
    const linkDownload = `${appUrl}/api/email/track/download/${envio.trackingToken}`;
    
    // Tracking Pixel: imagem invisível de 1x1px que registra quando o e-mail é aberto
    const pixelAbertura = `${appUrl}/api/email/track/open/${envio.trackingToken}`;

    const htmlContent = `
      ${envio.corpoEmail}
      <br><br>
      <p>
        <a href="${linkDownload}" style="background-color: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
           Baixar Documento: ${envio.nomeArquivo}
        </a>
      </p>
      <br>
      <p style="font-size: 12px; color: #666;">
        Este é um e-mail automático do sistema Radar Conta Certa.
      </p>
      
      <!-- 🕵️ TRACKING PIXEL INVISÍVEL (1x1px) -->
      <!-- Quando o cliente abre o e-mail, o cliente de e-mail baixa esta imagem, acionando o endpoint de abertura -->
      <img src="${pixelAbertura}" width="1" height="1" style="display:none;" />
    `;

    // 5. ENVIAR O E-MAIL VIA SMTP
    await this.transporter.sendMail({
      from: `"Radar Conta Certa" <${this.configService.get('SMTP_USER')}>`,
      to: envio.clienteEmail,
      subject: envio.assunto,
      html: htmlContent,
    });

    // 6. ATUALIZAR O BANCO DE DADOS COM SUCESSO
    // Marca como ENVIADO, registra o caminho final e a data/hora do envio
    await this.prisma.emailEnvio.update({
      where: { id: envio.id },
      data: {
        status: 'ENVIADO',
        enviado: true,
        caminhoFinal: caminhoFinal, // Salva o novo caminho organizado (ex: Enviados/Fernanda Lopes Toledo/092026/arquivo.pdf)
        dataEnvio: new Date(),
      },
    });

    this.logger.log(`✅ E-mail enviado e arquivo organizado para ${envio.clienteEmail} (ID: ${envio.id})`);
  }
}