Sistema de Envios — Estado Atual e Plano de Teste
🔍 Como Está Configurado Atualmente
Baseado nas ADRs e no código que implementamos, o sistema está parcialmente configurado. Vou te explicar o que temos e o que falta:
✅ O que JÁ está implementado:
Watch Folder via Chokidar (ADR-113)
Monitora pastas em tempo real
Detecta quando arquivos são criados/modificados
Parser de CNPJ no nome do arquivo (ADR-118)
Identifica automaticamente qual cliente pertence o arquivo
Ex: DAS_12345678000199_202610.pdf → extrai CNPJ 12.345.678/0001-99
Templates de Email Editáveis (ADR-115)
Templates Handlebars customizáveis
Preview ao vivo no frontend
Envio Plugável (ADR-116)
Suporta SendGrid, SMTP real ou MODO LOG (apenas logs)
Configuração via .env
Tracking de Envio (ADR-114)
Pixel 1x1 para saber se o cliente abriu o email
Link proxy para downloads rastreados
Aprovação Obrigatória (ADR-117)
Human-in-the-Loop: envio nunca é 100% automático
Fila de aprovação antes do envio real
Campos no Catálogo de Obrigações (ADR-123)
folderPath: caminho da pasta de monitoramento
fileNamePattern: padrão do nome do arquivo (ex: DAS_*.pdf)
postProcessAction: manter/mover/deletar após processamento
❌ O que AINDA NÃO está implementado:
Worker de Integração (pendente da ADR-123)
Não existe um serviço que lê folderPath de cada obrigação e registra watchers dinâmicos
O watch folder atual é genérico, não vinculado ao catálogo de obrigações
Verificação de "Obrigação Não Cumprida"
Não há cron job que verifica se a pasta está vazia na data de vencimento
Não há envio automático de alerta ao super admin
Disparo Automático para o Cliente
O sistema não envia email automaticamente quando detecta arquivo na pasta
Ainda depende de aprovação manual (fila de aprovação)
🎯 Fluxo Teórico vs Real
Fluxo que você descreveu (ideal):

123456789
Fluxo que temos atualmente (real):

1234567891011
Plano de Teste Prático
Vamos executar um teste end-to-end para validar o que funciona e identificar o que falta.
Passo 1: Verificar Configuração de Envio
Primeiro, preciso saber como seu .env está configurado. Execute:
powershell

12
Me envie o resultado (pode omitir senhas/tokens reais).
Passo 2: Criar Obrigação de Teste
Acesse: http://localhost:3000/dashboard/admin/obrigacoes
Clique em "Nova Obrigação"
Preencha:
Nome: DAS - Teste Outubro 2026
Mininome: DAS-TESTE
Departamento: Fiscal
Responsável: Ediane (ou qualquer um)
Dias de Entrega: Dia 20 para todos os meses
Na seção " Localização de Arquivos (Watch Folder)":
Caminho da Pasta: C:\radar-clone\testes\obrigacoes\das
Padrão de Nome: DAS_*.pdf
Ação Pós-Processamento: Manter na pasta
Clique em "Salvar Obrigação"
Passo 3: Criar Pasta de Teste
powershell

1
Passo 4: Verificar se o Watch Folder Está Ativo
No backend, execute:
powershell

12
Observe os logs. Se o watch folder estiver ativo, você verá algo como:

1
Se não aparecer nada, significa que o worker de integração ainda não foi implementado (confirmado pela ADR-123 como "pendente").
Passo 5: Colocar Arquivo de Teste na Pasta
Crie um PDF simples de teste:
powershell

12
Passo 6: Observar Comportamento
Cenário A: Sistema detecta automaticamente
Logs mostram: File detected: DAS_12345678000199_202610.pdf
Cria registro em ObligationDelivery com status PENDENTE
Aparece na fila de aprovação
Cenário B: Sistema NÃO detecta
Nenhum log aparece
Confirma que o worker de integração está pendente
🚨 O que Provavelmente Vai Acontecer
Baseado no código que revisamos, o cenário B é o mais provável. O watch folder existe (ADR-113), mas não está integrado ao catálogo de obrigações (ADR-123 pendente).
Próximos Passos Após o Teste
Dependendo do resultado, temos dois caminhos:
Se funcionar (Cenário A):
Refinar o fluxo de aprovação automática
Implementar verificação de "obrigação não cumprida"
Se NÃO funcionar (Cenário B - mais provável):
Implementar o worker de integração (ADR-123)
Criar cron job para verificação de obrigações vazias
Adicionar envio automático de alertas ao super admin
❓ Antes de Começar o Teste
Me confirme:
Qual modo de envio você quer usar?
MODO LOG (apenas logs, não envia email real) — recomendado para testes
SMTP (envio real via servidor de email)
SendGrid (serviço externo)
Você quer que eu implemente o worker de integração AGORA (para o teste funcionar de verdade) ou prefere primeiro validar o que já existe?
Qual email do super admin deve receber as notificações?
Assim que você responder, seguimos com o teste! 🚀
