🎥 Análise completa do vídeo + Projeto novo
PARTE 1 — TUDO O QUE VI NO VÍDEO (frame a frame)
Tela 1 — Dashboard principal
Painel Informativo (superior) com 6 KPIs:
7 Usuários
146 Organizações
4 Departamentos
581 Contatos
155 Pessoas
(sem métrica de SLA nem de tracking)
Painel Geral: atendimentos de usuários vs. bot, tempo médio de espera
Painel Segmentado: gráfico de barras por departamento com filtro temporal (Hoje / 7 dias / 15 dias / 30 dias)
Tela 2 — Chat
3 filas laterais: Atendimento, Em espera, Contatos
Campo de busca global + grupos
Ao abrir conversa, o bot se apresenta e dispara o menu principal de teclas (1 a 7)
Tela 3 — Robô "Conta Certa" (o coração do atendimento)
Menu numerado fixo:
Atendimento
Nota Fiscal
Financeiro
Contábil/Fiscal
Pessoal/RH
Legalização
Solicitar documento (GED Acessórias)
Eventos configuráveis: Recepção e GED
Limite de 3 tentativas inválidas antes de transferir
Mensagem de fallback genérica: "Opção inválida!"
Sem detecção de intenção em texto livre (se o cliente digitar "preciso de nota fiscal urgente", o bot não reconhece e cai no fallback)
Tela 4 — Mensagens padrão (6 grupos)
Mensagens comuns
Transições
Atendimento
Departamento
Avaliações ⚠️ (grupo vazio!)
Notificações
Variáveis já padronizadas: $nome_do_contato, $nome_do_atendente, $nome_do_departamento, $protocolo
Toggle individual por mensagem
Tela 5 — Administração (9 módulos)
Usuários (lista com permissões)
Cargos com árvore de permissões granular (muito maduro)
Departamentos (apenas 4 ativos, mas o bot lista 7!)
Organizações
Pessoas
Contatos (WhatsApp / Instagram / Facebook)
Tags
Assunto do Chamado ⚠️ (marcado como INATIVO!)
Feriados e Horários
Tela 6 — Infraestrutura
Integraegracao com Acess GED Acessórias
Importação CSV de contatos
API Tokens com permissões granulares
Inconsistências críticasidas
Departamentos desencontrados: bot tem "Contábil/Fiscal", "Pessoal/RH", "Legalização" que não existem no cadastro de departamentos (só 4 estão ativos)
Módulos ociosos: Avaliações sem mensagens e Assunto do Chamado inativo — exatamenteando exatamente a fonte de sinal do bot
Feriado genérico ("POSSUI MENSAGEM?") sem conteúdo real
Sem fallback inteligente: qualquer texto livre é rejeitado como inválido
Sem memória entre sessões: cliente que volta recomeça do zero
Tracking completamente isolado do chat: cliente pergunta "como está meu documento?" e o bot não tem essa informação

PARTE 2 — O QUE PODEMOS MELHORAR
🔴 Melhores críticas (o que está travando valor hoje)

Problema
Impacto
Solução imediata
Bot 100% determinístico (só menu)
Perde 60%+ das intenções em texto livre
Adicionar classificador de intenção no fallback
Zero memória entre sessões
Cliente recorrente recomeça sempre
Camada de perfil persistente
Tracking sem voz com chat
Cliente pergunta status e fica sem resposta
Webhooks de evento + variáveis $status_tracking
Departamentos desencontrados
Cliente escolhe algo que não existe no backend
Sincronizar o bot com o cadastro
Módulos Avaliações e Assunto INATIVOS
Você perdeuou sem feedback e sem rótulo de intenção
Ativar e alimentarar ao bot
Mensagens sem variáveis de tracking
"Status" nunca responde a realidade
Criar grupo "Tracking" com variáveis dinâmicas

🟢 Pontosidades (o que dá para escalar)
Arquitetura de permissões em árvore — uma das mais maduras que já vi em SaaS de pequeno porte
Integração Acess GED Acessórias já operacional
Variáveis padronizadas ($nome_do_contato, $protocolo) — boa base
Multicanal na base de contatos — Instagram e Facebook já integrados na base
PARTE 3 — O NOVO PROJETO: COMO Conta Certa AI"
Nome do módulo (proposta)
"Conta Certa AI — Motor de Inteligência Conversacional com Memória Permanente"

Como ficaria na arquitetura

┌─────────────────────────────────────────────────────────────────────┐
│                        SITE CONTA CERTA (hoje)                      │
│                                                                     │
│  Envio + Tracking (em construção)  ──▶  BOT Komunic (existente)    │
│         │                                      ▲                      │
│         │ Webhooks (enviado/visualizado/       │ Consultas            │
│         │ respondido/concluído)                 │ $status_tracking     │
└─────────┼──────────────────────────────────────┼──────────────────────┘
          │                                      │
          ▼                                      │
┌─────────────────────────────────────────────────┴──────────────────┐
│                  NOVO MÓDULO: CONTA CERTA AI                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  CAMADA 1: MEMÓRIA DO CONTATO (perfil persistente)           │   │
│  │  • Unifica WhatsApp + Instagram + Facebook pelo documento   │   │
│  │  • Histórico de assuntos, preferências de canal/horário       │   │
│  │  • Pendências abertas, última interação                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  CAMADA 2: BASE SEMÂNTICA (RAG)                              │   │
│  │  • pgvector sobre Postgres 15 (que você já tem)             │   │
│  │  • Conhecimento extraído de atendimentos humanos reais       │   │
│  │  • Embeddings via Mistral (mesma API do Extrator Bancário)  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  CAMADA 3: CLASSIFICADOR DE INTENÇÃO                         │   │
│  │  • Labels iniciais = teclas do menu (1 a 7)                  │   │
│  │  • Treinamento grátis com o menu atual como rótulo          │   │
│  │  • Detecta novas intenções frequentes → sugere ao admin     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  CAMADA 4: LOOP DE APRENDIZADO (Human-in-the-Loop)          │   │
│  │  • Fila de aprovação humana ANTES de virar conhecimento      │   │
│  │  • Reutiliza o framework regras_aprendidas.json da Fase 6   │   │
│  │  • Dashboard de revisão para o time                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

🎯 5 grandes entregas do projeto novo
1. Mensagens inteligentes no bot (novos grupos)

Grupo
Mensagens
Memória e Retorno
"Bem-vindo de volta, $nome_do_contato! Da última vez cuidamos de $ultimo_assunto. Quer continuar?"
Tracking
"Seu pedido $protocolo está em: $status_tracking (etapa $etapa_atual)."
Fila inteligente
"Você é o $posicao_fila da fila. Estimativa: $tempo_estimado."
Pós-atendimento
"O protocolo $protocolo foi resolvido? (1-Sim / 2-Não)"

2. Memória permanente em 2 camadas
Curto prazo (sessão): contexto do atendimento atual (assunto, documentos, sentimento)
Longo prazo (perfil): histórico por contato unificado, disponível em todas as próximas interações
3. Aprendizado com aprovação humana
Nenhuma regra nova entra em produção sem o admin aprovar
Coerente com o padrão Human-in-the-Loop do Extrator Bancário
Dashboard de "Conhecimentos Candidatos" (pendentes/aprovados/rejeitados)
4. Classificador de intenção no fallback
Em vez de "Opção inválida!", o bot:
Tenta classificar a intenção do texto
Se confiança alta → executa
Se confiança média → pede confirmação ("Você quis dizer Nota Fiscal?")
Se baixa → oferece transferência + coleta intenção para aprendizado futuro
5. Funil unificado no Dashboard
Novo painel "Comunicações & IA" com:
Taxa de contenção do bot
Intenções mais frequentes (novo vs. já cobertas)
CSAT por departamento
SLA estourados com escalonamento automático
🗺️ Como o projeto entra no Radar (sua casa real)
Baseado nos repositórios que analisei, o projeto não é um 4º sistema — é o módulo 4 do Radar, ao lado de:
Gestão do Escritório (Produto 1)
Operação Mensal do Cliente (Produto 2)
Extrator Bancário (F11)
Conta Certa AI (F13-F16) ← aqui
📅 Roadmap sugerido (4 sprints)

Sprint
Entregas
F13 — Tracking ↔ Radar
Webhooks de evento, ID único casado com $protocolo, aba "Envios" no Radar
F14 — Memória do Cliente
Tabelas MemoriaContato + MemoriaInteracao no Prisma, endpoint de histórico, mensagem de cliente recorrente
F15 — Aprendizado assistido
Classificador de intenção, RAG com pgvector, fila de aprovação, 4 novos grupos de mensagens
F16 — Métricas + hardening
Dashboard do bot, CI/CD, Sentry, backups (junta com o hardening já previsto)

⚠️ Ajustes urgentes de higiene (pré-requisitos)
Antes de começar a F13, é preciso:
Remover backend/.env commitado — segredos expostos
Gitignore node_modules/ (backend e frontend) — repo vai inflar
Resolver a duplicação do radar-clone (repo próprio + pasta dentro do site) — senão a memória nasce em dois lugares
Remover routes.rar e backup-scripts-antigos — binário morto
Sincronizar os 7 departamentos do bot com os 4 cadastros — inconsistência estrutural
🎯 Resumo executivo
Aspecto
Status atual
Status após projeto
Bot
Menu determinístico (1-7)
Conversacional com fallback inteligente
Memória
Nenhuma (sessão descartável)
Perfil persistente unificado
Tracking
Isolado do chat
Bidirecional com o bot
Aprendizado
Inexistente
Loop com aprovação humana (Human-in-the-Loop)
Integração
3 sistemas separados
Ecossistema unificado no Radar

🎯 Expandindo o projeto: Classificação analítica + Multi-canal + Multi-usuário
Excelentes ideias! Vou detalhar cada uma e como elas se integram ao que já temos.
1. 📊 CLASSIFICAÇÃO ANALÍTICA DAS CONVERSAS (sua ideia)
O que é
Uma camada humana de análise em cima de todas as conversas, onde você (ou analistas) podem ler e classificar manualmente os atendimentos para descobrir:
Pedidos fáceis vs. complexos
Só informações (sem atendimento real)
Abertura de empresas
Problemas recorrentes
Gargalos de tempo
Como ficaria no sistema
Novo módulo no Radar: "Análise de Conversas"

┌─────────────────────────────────────────────────────────────┐
│  ANÁLISE DE CONVERSAS                                       │
│                                                             │
│  [Lista de conversas com filtros]                          │
│  • Período: últimos 30 dias                                │
│  • Departamento: Todos | Fiscal | RH | Financeiro         │
│  • Canal: Todos | WhatsApp | Instagram | Facebook         │
│  • Status: Não analisadas | Analisadas                    │
│                                                             │
│  Ao clicar em uma conversa:                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Timeline completa da conversa (cliente + bot +      │   │
│  │  atendente humano)                                    │   │
│  │                                                      │   │
│  │  Classificação manual:                               │   │
│  │  • Tipo: [Dropdown]                                  │   │
│  │    - Dúvida simples                                  │   │
│  │    - Pedido de documento                             │   │
│  │    - Abertura de empresa                            │   │
│  │    - Fechamento mensal                              │   │
│  │    - Problema técnico                               │   │
│  │    - Só informação (sem ação)                       │   │
│  │                                                      │   │
│  │  • Complexidade: [1-5 estrelas]                     │   │
│  │  • Tempo gasto: [auto-calculado] minutos            │   │
│  │  • Resolveu?: [Sim | Parcialmente | Não]            │   │
│  │  • Tags livres: [#urgente #repetitivo #SLA]         │   │
│  │                                                      │   │
│  │  [Salvar classificação]                             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
Dashboard analítico (novo painel)
┌─────────────────────────────────────────────────────────────┐
│  DASHBOARD DE ANÁLISE                                       │
│                                                             │
│  TOP 10 TIPOS DE PEDIDOS (últimos 30 dias)                │
│  ┌─────────────────────────────────────────────────┐       │
│  │ 1. Dúvida simples          ████ 32% (48 msgs)   │       │
│  │ 2. Pedido de documento     ███  24% (36 msgs)   │       │
│  │ 3. Abertura de empresa     ██   18% (27 msgs)   │       │
│  │ 4. Só informação           ██   15% (22 msgs)   │       │
│  │ 5. Fechamento mensal       █    11% (17 msgs)   │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  GARGALOS DE TEMPO (tempo médio por tipo)                 │
│  • Abertura de empresa: 47 min ⚠️                         │
│  • Fechamento mensal: 32 min                               │
│  • Pedido de documento: 12 min                             │
│  • Dúvida simples: 4 min                                   │
│                                                             │
│  INSIGHTS AUTOMÁTICOS:                                     │
│  ⚠️ 68% das mensagens são "dúvidas simples" que poderiam  │
│     ser resolvidas pelo bot com melhor treinamento         │
│  ⚠️ Departamento Fiscal gasta 3x mais tempo em abertura   │
│     de empresas que outros departamentos                   │
│                                                             │
│  [Exportar CSV] [Criar nova mensagem de bot para "dúvida  │
│  simples frequente"]                                        │
└─────────────────────────────────────────────────────────────┘
Integração com aprendizado automático
Sugestão de classificação: quando você abrir uma conversa, o sistema sugere: "Esta parece ser 'dúvida simples' (confiança 87%). Confirmar?"
Alimentar o bot: botão "Virar mensagem de bot" → transforma a resposta humana em mensagem padrão para o robô
Detectar padrões: se 80% das "dúvidas simples" são sobre "como emitir nota fiscal", o sistema sugere: "Criar FAQ automático?"
Tabela Prisma
Integração com aprendizado automático
Sugestão de classificação: quando você abrir uma conversa, o sistema sugere: "Esta parece ser 'dúvida simples' (confiança 87%). Confirmar?"
Alimentar o bot: botão "Virar mensagem de bot" → transforma a resposta humana em mensagem padrão para o robô
Detectar padrões: se 80% das "dúvidas simples" são sobre "como emitir nota fiscal", o sistema sugere: "Criar FAQ automático?"
Tabela Prisma

2. 📱 MULTI-CANAL EM UM ÚNICO NÚMERO
O que é
Usar WhatsApp + Instagram + Facebook mas centralizar tudo em um único identificador (o "número" do escritório), onde o cliente pode começar no WhatsApp e continuar no Instagram sem perder o contexto.
Como funciona (arquitetura)

┌─────────────────────────────────────────────────────────────┐
│  CLIENTE: "João Silva"                                      │
│                                                             │
│  WhatsApp: +55 11 99999-9999                                │
│  Instagram: @joao.silva                                    │
│  Facebook: fb.com/joao.silva                               │
│                                                             │
│              ▼ TODOS APONTAM PARA ▼                         │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  PERFIL UNIFICADO: João Silva                         │  │
│  │  Documento: 123.456.789-00                            │  │
│  │  Histórico: conversa WhatsApp + Instagram + Facebook  │  │
│  │  Última interação: Instagram (2h atrás)              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

Tecnologias necessárias

Canal
API
Como integra
WhatsApp
WhatsApp Business API (via Meta)
Número único do escritório, clientes mandam mensagem para esse número
Instagram
Instagram Graph API
Cliente manda DM para @contacerta, sistema recebe como se fosse o escritório
Facebook
Facebook Page Messages API
Cliente manda mensagem para a página, sistema centraliza

Como o Komunic (ou similar) faria isso

┌─────────────────────────────────────────────────────────────┐
│  KOMUNIC (ou alternativa provider multi-canal)                    │
│                                                             │
│  1. Cliente manda mensagem no WhatsApp                     │
│     → Komunic recebe via webhook                        │
│     → Cria/associa ao perfil unificado                  │
│     → Roteia para o bot ou atendente                  │
│                                                             │
│  2. Mesmo cliente manda no Instagram                 │
│     → Komunic reconhece pelo documento/telefone      │
│     → Mescla histórico no perfil existente               │
│     → Mostra histórico como "continuação" no dashboard   │
│                                                             │
│  3. Atendente responde no Komunic                       │
│     → Sistema decide: mandar no WhatsApp? Instagram? │
│     → Ou nos dois ao mesmo tempo?                 │
└─────────────────────────────────────────────────────────────┘

Custos (estimativa)
Serviço
Preço mensal
Observação
WhatsApp Business API
~$0.005 por mensagem enviada
~R$ 0.025 por mensagem
Instagram Graph API
Grátis
Meta não cobra por DMs
Facebook Page Messages
Grátis
Meta não cobra
Komunic (ou similar)
~R$ 200-500/mês
Plataforma de unificação

Vantagens
Cliente não percebe diferença: ele fala pelo canal que preferir, você responde de forma unificada
Histórico completo: se o cliente pergunta no WhatsApp e voltou no Instagram, você vê tudo junto
Um número central: você divulga "Fale conosco no WhatsApp: (11) 99999-9999" e esse número pode receber mensagens de Instagram/Facebook também (via QR code/link)
Alternativa mais simples (sem Komunic)
Se você quiser construir isso do zero:

// Unificador de canais
class UnificadorCanais {
  async receberMensagem(canal, mensagemExterna) {
    // 1. Identifica o cliente pelo documento/telefone
    const cliente = await this.identificarCliente(canal, mensagemExterna);
    
    // 2. Cria ou recupera o perfil unificado
    const perfil = await this.getPerfilUnificado(cliente.documento);
    
    // 3. Salva no banco com o canal de origem
    await this.salvarMensagem({
      perfilId: perfil.id,
      canal: canal, // "whatsapp", "instagram", "facebook"
      mensagem: mensagemExterna.texto,
      timestamp: new Date()
    });
    
    // 4. Roteia para o bot ou atendente
    return this.rotear(perfil, mensagemExterna);
  }
  
  async enviarResposta(perfilId, resposta) {
    // Decide qual canal usar baseado na última interação
    const perfil = await this.getPerfil(perfilId);
    const canalPreferido = perfil.ultimoCanal; // "whatsapp" por exemplo
    
    return this.enviar(canalPreferido, perfil, resposta);
  }
}

3. 👥 MÚLTIPLOS USUÁRIOS SIMULTÂNEOS (6 atendentes)
Resposta direta: SIM, é totalmente possível!
Você já tem 7 usuários no dashboard, então a infraestrutura de multi-usuário já existe. O que precisamos é garantir que 6 atendentes possam usar ao mesmo tempo sem conflitos.
Como funciona

┌─────────────────────────────────────────────────────────────┐
│  FILA DE ATENDIMENTO (visão do sistema)                    │
│                                                             │
│  [Em espera] ← 12 conversas aguardando                   │
│    ├─ João (WhatsApp) - 5 min aguardando                 │
│    ├─ Maria (Instagram) - 3 min aguardando               │
│    ├─ Pedro (WhatsApp) - 8 min aguardando                │
│    └─ ...                                                  │
│                                                             │
│  [Em atendimento] ← 6 conversas ativas                   │
│    ├─ Ana (atendida por Usuário 1) - WhatsApp            │
│    ├─ Bruno (atendida por Usuário 2) - Instagram         │
│    ├─ Carla (atendida por Usuário 3) - WhatsApp          │
│    ├─ Daniel (atendida por Usuário 4) - Facebook         │
│    ├─ Elisa (atendida por Usuário 5) - WhatsApp          │
│    └─ Fábio (atendida por Usuário 6) - Instagram         │
│                                                             │
│  [Contatos] ← todos os outros                             │
└─────────────────────────────────────────────────────────────┘

Arquitetura técnica
1. Lock de conversa (evita 2 atendentes pegando a mesma)

// Quando atendente clica em "Atender"
async function assumirConversa(conversaId, atendenteId) {
  // Tenta criar lock com timeout de 30min
  const lock = await db.conversaLock.create({
    data: {
      conversaId: conversaId,
      atendenteId: atendenteId,
      expiraEm: new Date(Date.now() + 30 * 60 * 1000)
    }
  }).catch(err => {
    // Lock já existe = outro atendente já pegou
    throw new Error('Esta conversa já está sendo atendida por outro colega');
  });
  
  return lock;
}

2. WebSocket para tempo real (todos veem atualizações

// Atendente 1 envia mensagem
socket.emit('nova_mensagem', {
  conversaId: 'abc123',
  mensagem: 'Olá, como posso ajudar?',
  atendenteId: 1
});

// Atendentes 2, 3, 4, 5, 6 recebem a atualização em tempo real
socket.on('nova_mensagem', (data) => {
  if (data.conversaId !== minhaConversaAtual) {
    atualizarListaDeConversas(); // Refresca a tela
  }
});

3. Distribuição automática (round-robin ou por habilidade)

// Quando chega nova conversa
async function distribuirConversa(conversa) {
  // Pega atendente disponível com menos conversas
  const atendentes = await db.atendente.findMany({
    where: { 
      status: 'online',
      conversasAtivas: { lt: 5 } // máximo 5 por atendente
    },
    orderBy: { conversasAtivas: 'asc' }
  });
  
  if (atendentes.length === 0) {
    // Fila de espera
    return await db.filaEspera.create({ data: conversa });
  }
  
  // Atribui para o primeiro
  return await atribuirConversa(conversa.id, atendentes[0].id);
}

Configuração recomendada
Parâmetro                       Valor sugerido      Motivo
Máx. conversas por atendente        5               Evita sobrecarga
Timeout de lock                     30 min          Se atendente sair, libera a conversa
Máx. na fila de espera              20              Depois disso, bot oferece retorno
Prioridade por SLA                  Sim             Conversas antigas sobem na fila

Dashboard para 6 atendentes

┌─────────────────────────────────────────────────────────────┐
│  VISÃO DO GESTOR (você)                                     │
│                                                             │
│  ATENDENTES ONLINE: 6/7                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Usuário 1: 3 conversas ativas | 2 na fila          │   │
│  │ Usuário 2: 5 conversas ativas | 0 na fila ⚠️       │   │
│  │ Usuário 3: 2 conversas ativas | 4 na fila          │   │
│  │ Usuário 4: 4 conversas ativas | 1 na fila          │   │
│  │ Usuário 5: 1 conversa ativa  | 6 na fila          │   │
│  │ Usuário 6: 4 conversas ativas | 0 na fila          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  FILA GERAL: 13 conversas aguardando                       │
│  TEMPO MÉDIO DE ESPERA: 4 min                              │
│                                                             │
│  [Redistribuir manualmente] [Pausar Usuário 2]             │
└─────────────────────────────────────────────────────────────┘

🎯 RESUMO DAS 3 MELHORIAS
Funcionalidade
O que faz
Integração com existente
Classificação analítica
Você lê e classifica manualmente as conversas para descobrir gargalos
Novo módulo no Radar + dashboard de insights
Multi-canal unificado
WhatsApp + Instagram + Facebook em um único "número" do escritório
Komunic (ou similar) + perfil unificado por documento
6 usuários simultâneos
Múltiplos atendentes trabalhando ao mesmo tempo sem conflitos
Sistema de locks + WebSocket + distribuição automática
Roadmap atualizado (5 sprints)
Sprint
Entregas
F13 — Tracking ↔ Radar
Webhooks de evento, ID único, aba "Envios"
F14 — Memória do Cliente
Perfil persistente, mensagem de cliente recorrente
F15 — Aprendizado + Classificação
Classificador automático + módulo de análise manual + dashboard de insights
F16 — Multi-canal unificado
Integração WhatsApp + Instagram + Facebook, perfil unificado
F17 — Multi-usuário avançado
Locks, WebSocket, distribuição automática, dashboard do gestor
Custos estimados (mensal)
Item
Custo
WhatsApp Business API
~R$ 0.02 por mensagem
Komunic (ou similar)
~R$ 300-500/mês
Servidor (6 usuários simultâneos)
~R$ 200-400/mês
Total estimado
~R$ 500-900/mês + mensagens WhatsApp


📅 Cronograma detalhado (sprint por sprint)
F13 — Tracking ↔ Radar (2-3 semanas)
Entregas:
Semana 1: Webhooks de evento no Sistema de Envio (enviado/visualizado/respondido)
Semana 2: Tabelas ComunicacaoEnvio + ComunicacaoEvento no Prisma
Semana 3: Aba "Envios" no Radar com funil básico
Quando você pode usar: ✅ Final da semana 3 — consegue ver no Radar todos os envios feitos pelo Sistema de Tracking
F14 — Memória do Cliente (2-3 semanas)
Entregas:
Semana 4: Tabelas MemoriaContato + MemoriaInteracao
Semana 5: Endpoint de histórico consumido pelo bot
Semana 6: Mensagem de cliente recorrente ("Bem-vindo de volta, da última vez cuidamos de...")
Quando você pode usar: ✅ Final da semana 6 — bot lembra do cliente quando ele volta, histórico unificado
F15 — Aprendizado + Classificação (3-4 semanas)
Entregas:
Semana 7: Classificador de intenção no fallback do bot (Mistral ou modelo leve)
Semana 8: Módulo de análise manual no Radar (você lê e classifica conversas)
Semana 9: Dashboard de insights ("68% são dúvidas simples")
Semana 10: Fila de aprovação humana para novos conhecimentos
Quando você pode usar: ✅ Final da semana 10 — você já tem o MVP completo e pode colocar em produção
F16 — Multi-canal unificado (4-5 semanas)
Entregas:
Semana 11: Integração WhatsApp Business API (via Komunic ou direto)
Semana 12: Integração Instagram Graph API
Semana 13: Integração Facebook Page Messages
Semana 14: Perfil unificado por documento
Semana 15: Testes de mesclagem de histórico
Quando você pode usar: ✅ Final da semana 15 — cliente pode falar no WhatsApp e continuar no Instagram
F17 — Multi-usuário avançado (3-4 semanas)
Entregas:
Semana 16: Sistema de locks de conversa
Semana 17: WebSocket para tempo real
Semana 18: Distribuição automática (round-robin)
Semana 19: Dashboard do gestor (visão dos 6 atendentes)
Quando você pode usar: ✅ Final da semana 19 — 6 atendentes trabalhando simultaneamente sem conflitos
🚀 Estratégia recomendada: MVP + aprimoramento contínuo
Fase 1: MVP (semanas 1-10)
Objetivo: Ter algo funcional para começar a usar imediatamente
Sprint
Entregas críticas
Quando usar
F13
Tracking no Radar
✅ Semana 3
F14
Memória básica
✅ Semana 6
F15
Classificação manual
✅ Semana 10
Resultado: Você tem:
✅ Sistema de Envio com Tracking integrado ao Radar
✅ Bot que lembra do cliente
✅ Dashboard onde você classifica conversas manualmente para descobrir gargalos
✅ Classificador de intenção básico no fallback
A partir da semana 10, você já está em produção e gerando dados reais.
Fase 2: Aprimoramento (semanas 11-19)
Objetivo: Adicionar funcionalidades avançadas enquanto o sistema já está em uso
Sprint
Entregas
Benefício
F16
Multi-canal
Cliente fala por qualquer canal
F17
Multi-usuário
6 atendentes simultâneos
Durante essa fase, você já está coletando dados de uso real e pode priorizar melhorias baseado no que está acontecendo:
Se 80% das conversas são do WhatsApp → adiar Instagram/Facebook
Se só 2 atendentes usam → adiar otimizações de 6 usuários
Se classificação manual está lenta → acelerar aprendizado automático
Fase 3: Otimização contínua (semana 20+)
Objetivo: Refinar baseado em dados reais
Melhoria
Quando
Aprendizado automático mais preciso
Após 500+ conversas classificadas
Novos tipos de mensagem no bot
Baseado nos padrões descobertos
Automação de respostas frequentes
Quando 30%+ são do mesmo tipo
Exportação de relatórios
Quando o time pedir

⚡ Fatores que podem ACELERAR (cortar 30-40% do tempo)
Fator
Impacto
Resolver higiene do repo AGORA (.env, node_modules, duplicação)
Evita retrabalho e conflitos
Usar Komunic ao invés de construir multi-canal do zero
Economiza 4-5 semanas (F16 inteira)
Começar com 1 canal (WhatsApp) e expandir depois
MVP mais rápido
Limitar classificação manual a 5 tipos iniciais
Não criar 20 categorias de uma vez
Reutilizar o framework regras_aprendidas do Extrator
Não reinventar a roda do aprendizado
Com essas otimizações:
MVP: 6-8 semanas (ao invés de 10)
Completo: 16-18 semanas (ao invés de 24)

🐌 Fatores que podem ATRASAR (adicionar 30-50% do tempo)
Fator
Impacto
Não resolver .env commitado
Vulnerabilidade de segurança pode parar tudo
Duplicação do radar-clone não resolvida
Memória do bot em dois lugares = caos
Querer fazer tudo perfeito de primeira
Paralisia por análise
Mudar prioridades no meio
Retrabalho constante
Aprovações burocráticas lentas
Gargalo humano

📊 Recomendação final
Cenário realista (você trabalhando solo ou com 1 dev):

Semana 1-3:   F13 (Tracking ↔ Radar)
Semana 4-6:   F14 (Memória do Cliente)
Semana 7-10:  F15 (Classificação + Aprendizado básico)
─────────────────────────────────────────
✅ SEMANA 10: MVP em produção (você já usa)
─────────────────────────────────────────
Semana 11-15: F16 (Multi-canal, se quiser)
Semana 16-19: F17 (Multi-usuário, se quiser)
Semana 20+:   Otimizações baseadas em dados reais

Cenário otimizado (usando Komunic + foco no essencial):

Semana 1-2:   F13 (Tracking ↔ Radar)
Semana 3-4:   F14 (Memória do Cliente)
Semana 5-7:   F15 (Classificação)
Semana 8-10:  F16 (WhatsApp via Komunic)
─────────────────────────────────────────
✅ SEMANA 10: Sistema completo em produção
─────────────────────────────────────────
Semana 11+:   Expansão para Instagram/Facebook
              Multi-usuário avançado
              Aprendizado automático refinado

              