import { Controller, Get, Param, Res, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Response } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EmailSenderService } from './email-sender.service'; // ✅ Importado para acionar os envios

@Controller('api/email/track')
export class EmailTrackingController {
  private readonly logger = new Logger(EmailTrackingController.name);

  constructor(
    private prisma: PrismaService,
    private emailSender: EmailSenderService, // ✅ Injetado para podermos chamar o método de envio
  ) {}
  /**
   * 🗑️ EXCLUIR REGISTRO (Para limpar testes)
   */
  @Get('excluir/:id')
  async excluirRegistro(@Param('id') id: string) {
    await this.prisma.emailEnvio.delete({
      where: { id: id },
    });
    this.logger.log(`️ Registro ${id} excluído.`);
    return { message: 'Registro excluído com sucesso!' };
  }

    /**
   * 📤 ENVIAR INDIVIDUAL
   */
  @Get('enviar-individual/:id')
  async enviarIndividual(@Param('id') id: string) {
    try {
      await this.emailSender.enviarRegistroIndividual(id);
      return { message: 'E-mail enviado com sucesso!' };
    } catch (error: any) {
      this.logger.error(`Erro ao enviar e-mail individual ${id}:`, error);
      throw new Error(error.message);
    }
  }
  /**
   * 📊 LISTA DE ENVIOS (Para o Frontend)
   * Retorna todos os registros de envio, ordenados do mais recente para o mais antigo.
   */
  @Get('lista')
  async getListaEnvios() {
    const envios = await this.prisma.emailEnvio.findMany({
      orderBy: { criadoEm: 'desc' }, // Mostra os mais recentes primeiro
    });
    return envios;
  }

  /**
   * 🚀 DISPARAR ENVIOS (Acionado pelo botão do Frontend)
   * Varre o banco por status 'PENDENTE' e executa o processo de envio.
   */
  @Get('disparar')
  async dispararPendentes() {
    this.logger.log('🚀 Acionando processo de disparo de e-mails pendentes...');
    await this.emailSender.processPendingEmails();
    return { message: 'Processo de envio iniciado com sucesso!' };
  }

  /**
   * 👁️ TRACKING DE ABERTURA (Pixel Invisível)
   * Quando o cliente abre o e-mail, o cliente de e-mail baixa esta imagem 1x1px,
   * acionando este endpoint e registrando a abertura no banco.
   */
  @Get('open/:token')
  async trackOpen(@Param('token') token: string) {
    try {
      // Atualiza o registro apenas se ainda não estiver marcado como aberto
      await this.prisma.emailEnvio.updateMany({
        where: { trackingToken: token, aberto: false },
        data: { 
          aberto: true, 
          dataAbertura: new Date() 
        },
      });
      this.logger.log(`👁️ E-mail aberto! Token: ${token}`);
    } catch (error) {
      this.logger.error(`Erro ao registrar abertura do token ${token}`, error);
    }

    // Retorna um GIF transparente de 1x1 pixel em Base64 (padrão da indústria para tracking)
    const pixelGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    return pixelGif;
  }

  /**
   * 📥 TRACKING DE DOWNLOAD (Link Proxy)
   * O e-mail não leva o anexo direto, mas sim este link.
   * Quando o cliente clica, registramos o download e depois servimos o arquivo.
   */
  @Get('download/:token')
  async trackDownload(@Param('token') token: string, @Res() res: Response) {
    try {
      // 1. Busca o registro de envio pelo token único
      const envio = await this.prisma.emailEnvio.findUnique({
        where: { trackingToken: token },
      });

      // Segurança: Se o token não existir ou o arquivo não tiver sido movido ainda
      if (!envio || !envio.caminhoFinal) {
        throw new NotFoundException('Arquivo não encontrado ou link expirado/inválido.');
      }

      // 2. Registra o download no banco (apenas na primeira vez que clicar)
      if (!envio.baixado) {
        await this.prisma.emailEnvio.update({
          where: { id: envio.id },
          data: { 
            baixado: true, 
            dataDownload: new Date() 
          },
        });
        this.logger.log(`📥 Arquivo baixado! Cliente: ${envio.clienteNome} | Arquivo: ${envio.nomeArquivo}`);
      }

      // 3. Lê o arquivo físico do disco e envia para o navegador do cliente
      const arquivoBuffer = await fs.readFile(envio.caminhoFinal);
      
      // Configura os cabeçalhos para forçar o download com o nome original
      res.setHeader('Content-Disposition', `attachment; filename="${envio.nomeArquivo}"`);
      
      // Define o tipo de conteúdo (para DAS/Guias, geralmente é PDF. Pode ser dinâmico se precisar)
      res.setHeader('Content-Type', 'application/pdf'); 
      
      // Envia o buffer do arquivo
      res.send(arquivoBuffer);

    } catch (error) {
      this.logger.error(`Erro no download do token ${token}:`, error);
      throw new NotFoundException('Link inválido ou arquivo indisponível no servidor.');
    }
  }
}