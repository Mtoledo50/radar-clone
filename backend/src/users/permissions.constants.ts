/**
 * ============================================================================
 * 🆕 US-1 — MAPA DE BITS DAS PERMISSÕES (espelho fiel do CSV e-Contínuo)
 * ============================================================================
 * COMO LER ESTE ARQUIVO:
 *   • Cada constante P.XXX representa UMA FEATURE (bit isolado).
 *   • Valores usam bigint literal (sufixo "n") — obrigatório, pois somamos
 *     mais de 32 bits e Number comum estouraria.
 *   • Helpers grant()/has() fazem OR/AND entre bits.
 *   • Grupos LEVEL_* traduzem as escalas ordinais do CSV:
 *       "[2] = [1] + Transf. resp." significa que quem tem nível 2
 *       implicitamente tem nível 1 MAIS a capacidade adicional.
 *   • Quando for adicionar nova feature no futuro: escolha um índice livre
 *     (1 << n) maior que o último usado HOJE (=31), nunca reutilize.
 *
 * REGRAS DE NEGÓCIO EXTRAÍDAS DO CSV (validar contra o arquivo original):
 *   1. "Relatórios/Exportar e-mails": SOMENTE Ediane e Emilia têm Sim. 
 *      Todos os demais = Não. Este é o único caso de privilégio exclusivo raro.
 *   2. "Pode dispensar demandas": Fernanda = "inclusive em massa";
 *      todos os outros = Sim simples. Bit DISPENSAR_MASSA só pra ela.
 *   3. "Exclusão de registro": TODOS os 9 têm "Sim = Exclusões permitidas".
 *      Manter uniforme no BASE_COMMON.
 *   4. "Gestão de Processos" varia em camadas:
 *      - Juliane/Graziela/Neila/Ediane: VISUALIZAR+MOVIMENTAR+MAPEAR+EXCLUIR
 *      - Emilia/Geral/Lauren/Fernanda/Marcos: acima + AUTORIZA_INICIO
 *      - Marcos exclusivamente: acima + ACOES_MASSA
 *   5. Ordinais "Controle de Usuários" e "Cadastro de Departamentos" seguem
 *      a mesma estrutura [1]<[2]<[3]<[4] descrita nos headers do CSV.
 *      Todos os 9 usuários têm nível máximo [4] nas duas escalas.
 *   6. "Permissões do APLA", "Tempo previsto", "Salários/Honorários",
 *      "Config Área VIP/App", "Comunicados", "Solicitações", "Filtros
 *      Forçados": TODOS os 9 usuários têm acesso pleno (uniforme no CSV).
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BLOCO 1 — FEATURES BOOLEANAS SIMPLES (bit único, liga/desliga)
// ----------------------------------------------------------------------------
export const P = {
  /** Coluna "Configurações do Sistema e-Contínuo" — todos = Sim */
  CONFIG_SISTEMA:                1n << 0n,

  /** Coluna "Cadastro de Obrigações" — todos = Sim */
  CADASTRO_OBRIGACOES:           1n << 1n,

  /** Coluna "Regimes e Grupos de Obrigações" — todos = Sim */
  REGIMES_GRUPOS_OBRIG:          1n << 2n,

  /** Coluna "Cadastro de Empresas" — todos = Sim */
  CADASTRO_EMPRESAS:             1n << 3n,

  /** Coluna "Comentários e anotações" — todos = Sim */
  COMENTARIOS_NOTAS:             1n << 4n,

  /** Coluna "Gestão de contatos" — todos = Sim */
  GESTAO_CONTATOS:               1n << 5n,

  /** Coluna "Gestão de tarefas" — todos = Sim */
  GESTAO_TAREFAS:                1n << 6n,

  /** Coluna "Adicionar/alterar registros" — todos = Sim */
  ADICIONAR_ALTERAR:             1n << 7n,

  /** Coluna "Relatórios/Exportar e-mails" — SOMENTE EDIANE E EMILIA têm Sim */
  RELATORIOS_EXPORTAR_EMAILS:    1n << 8n,

  /** Coluna "Exclusão de registro" — todos = Sim (ver regra 3 acima) */
  EXCLUSAO_REGISTRO:             1n << 9n,

  /** Coluna "Pode apagar anexos (arquivos)?" — todos = Sim */
  APAGAR_ANEXOS:                 1n << 10n,

  /** Coluna "Pode dispensar demandas..." — Fernanda ganha bit EXTRA de massa */
  DISPENSAR_DEMANDAS:            1n << 11n,
  DISPENSAR_DEMANDAS_MASSA:      1n << 12n,  // exclusivo Fernanda

  /** Coluna "Demandas da Lista de Entregas e Solicitações" — todos nível [3] */
  DEMANDAS_LISTA_SOLICITACOES:   1n << 13n,

  /** Coluna "Pode alterar prazos técnicos/legais?" — todos = Sim */
  ALTERAR_PRAZOS_TECH_LEGAIS:    1n << 14n,

  /** Coluna "Permissões do APLA" — todos = Sim */
  PERMISSOES_APLA:               1n << 15n,

  /** Coluna "Tempo previsto das demandas" — todos = Sim */
  TEMPO_PREVISTO:                1n << 16n,

  /** Coluna "Salários e Honorários" — todos = Sim */
  SALARIOS_HONORARIOS:           1n << 17n,

  /** Coluna "Configurações Área VIP e App" — todos = Sim */
  CONFIG_AREA_VIP_APP:           1n << 18n,

  /** Coluna "Comunicados" — todos = Sim */
  COMUNICADOS:                   1n << 19n,

  /** Coluna "Solicitações" — todos = Sim */
  SOLICITACOES:                  1n << 20n,

  /** Coluna "Filtros Forçados" — todos = Sim */
  FILTROS_FORCADOS:              1n << 21n,

  // ----------------------------------------------------------------------------
  // BLOCO 2 — SUB-BITS DA LISTA ADITIVA "Gestão de Processos"
  // O CSV descreve capacidades empilhadas nesta coluna. Cada item vira um bit
  // independente para permitir concessão parcial se necessário no futuro.
  // ----------------------------------------------------------------------------
  /** Capacidade base: abrir/listar processos */
  PROC_VISUALIZAR:               1n << 22n,
  /** Mudar status/depto/responsável de processo existente */
  PROC_MOVIMENTAR:               1n << 23n,
  /** Editar matriz de responsabilidades vinculada ao processo */
  PROC_MAPEAR_MATRIZES:          1n << 24n,
  /** Excluir definitivamente um processo (não confundir com EXCLUSAO_REGISTRO) */
  PROC_EXCLUIR:                  1n << 25n,
  /** Autorizar INÍCIO de novo processo (Emilia/Geral/Lauren/Fernanda/Marcos) */
  PROC_AUTORIZA_INICIO:          1n << 26n,
  /** Operações em lote sobre múltiplos processos (somente Marcos) */
  PROC_ACESO_MASSA:              1n << 27n,

  // ----------------------------------------------------------------------------
  // BLOCO 3 — ORDINAIS CUMULATIVOS (escalas [1]<[2]<[3]<[4] do CSV)
  // Não são bits atômicos — são MÁSCARAS compostas pelos níveis anteriores.
  // Definimos como getters computados para evitar drift manual.
  // ----------------------------------------------------------------------------
  /** Controle de Usuários nível [1]: apenas visualizar lista */
  get CONTROLE_USUARIOS_L1(): bigint { return 0n; /* base implícita */ },
  /** Nível [2] = [1] + Transferir responsável de departamento */
  get CONTROLE_USUARIOS_L2(): bigint { return this.CONTROLE_USUARIOS_L1 | (1n << 28n); },
  /** Nível [3] = [2] + Definir gestores dos departamentos */
  get CONTROLE_USUARIOS_L3(): bigint { return this.CONTROLE_USUARIOS_L2 | (1n << 29n); },
  /** Nível [4] = [3] + Adicionar/Editar cadastros de usuário */
  get CONTROLE_USUARIOS_L4(): bigint { return this.CONTROLE_USUARIOS_L3 | (1n << 30n); },

  /** Cadastro de Departamentos nível [1]: visualizar árvore */
  get CADASTRO_DEPTOS_L1(): bigint { return 0n; },
  /** Nível [2] = [1] + Transferir responsável */
  get CADASTRO_DEPTOS_L2(): bigint { return this.CADASTRO_DEPTOS_L1 | (1n << 31n); },
  /** Nível [3] = [2] + Definir gestores */
  get CADASTRO_DEPTOS_L3(): bigint { return this.CADASTRO_DEPTOS_L2 | (1n << 32n); },
  /** Nível [4] = [3] + Adicionar/Editar cadastro de departamento */
  get CADASTRO_DEPTOS_L4(): bigint { return this.CADASTRO_DEPTOS_L3 | (1n << 33n); },
};

// ----------------------------------------------------------------------------
// HELPERS OPERACIONAIS (usados pelo guard e pelo seed)
// ----------------------------------------------------------------------------

/** Liga TODOS os bits pedidos numa máscara (retorna nova máscara imutável). */
export function grant(mask: bigint, ...bits: bigint[]): bigint {
  return bits.reduce((m, b) => m | b, mask);
}

/** Testa se a máscara contém TODOS os bits pedidos (AND lógico). */
export function has(mask: bigint, ...bits: bigint[]): boolean {
  return bits.every((b) => (mask & b) === b);
}

/** Converte máscara BigInt para array legível de nomes de flags (debug/logs). */
export function describeMask(mask: bigint): string[] {
  const names: string[] = [];
  for (const [key, val] of Object.entries(P)) {
    if (typeof val === 'bigint' && (mask & val) === val && val !== 0n) {
      names.push(key);
    }
  }
  return names.sort();
}