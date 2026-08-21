// =================================================================
// INICIO: backend/src/company/domain/formula-engine.ts
// =================================================================
/**
 * =================================================================
 * FormulaEngine - Sprint C3 (dominio puro, ADR-054)
 * =================================================================
 * Parser e avaliador de formulas matematicas SIMPLES e SEGURAS.
 * Aceita APENAS: variaveis whitelisted, operadores + - * / e parenteses.
 * NAO usa eval(), Function() ou qualquer sandbox perigoso.
 *
 * ADR-054: formula segura por whitelist (parser AST minimalista).
 * Deterministico: zero IA, zero HTTP, zero Prisma.
 * =================================================================
 */

export interface FormulaContext {
  [variableName: string]: number;
}

export interface ParseResult {
  valid: boolean;
  error?: string;
  ast?: ASTNode;
}

export type ASTNode =
  | { type: 'number'; value: number }
  | { type: 'variable'; name: string }
  | { type: 'binary'; op: '+' | '-' | '*' | '/'; left: ASTNode; right: ASTNode };

// =================================================================
// TOKENIZER
// =================================================================

interface Token {
  type: 'number' | 'variable' | 'op' | 'lparen' | 'rparen';
  value: string;
}

function tokenize(input: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  const s = input.replace(/\s+/g, '');

  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      let num = '';
      while (i < s.length && /[0-9.]/.test(s[i])) { num += s[i++]; }
      if (isNaN(Number(num))) return null;
      tokens.push({ type: 'number', value: num });
    } else if (/[a-zA-Z_]/.test(c)) {
      let name = '';
      while (i < s.length && /[a-zA-Z0-9_]/.test(s[i])) { name += s[i++]; }
      tokens.push({ type: 'variable', value: name });
    } else if ('+-*/'.includes(c)) {
      tokens.push({ type: 'op', value: c });
      i++;
    } else if (c === '(') {
      tokens.push({ type: 'lparen', value: c });
      i++;
    } else if (c === ')') {
      tokens.push({ type: 'rparen', value: c });
      i++;
    } else {
      return null;
    }
  }
  return tokens;
}

// =================================================================
// PARSER (descendente recursivo com precedencia)
// =================================================================

function parseExpr(tokens: Token[], pos: { i: number }): ASTNode | null {
  let left = parseTerm(tokens, pos);
  if (!left) return null;

  while (
    pos.i < tokens.length &&
    tokens[pos.i].type === 'op' &&
    (tokens[pos.i].value === '+' || tokens[pos.i].value === '-')
  ) {
    const op = tokens[pos.i].value as '+' | '-';
    pos.i++;
    const right = parseTerm(tokens, pos);
    if (!right) return null;
    left = { type: 'binary', op, left, right };
  }
  return left;
}

function parseTerm(tokens: Token[], pos: { i: number }): ASTNode | null {
  let left = parseFactor(tokens, pos);
  if (!left) return null;

  while (
    pos.i < tokens.length &&
    tokens[pos.i].type === 'op' &&
    (tokens[pos.i].value === '*' || tokens[pos.i].value === '/')
  ) {
    const op = tokens[pos.i].value as '*' | '/';
    pos.i++;
    const right = parseFactor(tokens, pos);
    if (!right) return null;
    left = { type: 'binary', op, left, right };
  }
  return left;
}

function parseFactor(tokens: Token[], pos: { i: number }): ASTNode | null {
  const tok = tokens[pos.i];
  if (!tok) return null;

  if (tok.type === 'number') {
    pos.i++;
    return { type: 'number', value: Number(tok.value) };
  }
  if (tok.type === 'variable') {
    pos.i++;
    return { type: 'variable', name: tok.value };
  }
  if (tok.type === 'lparen') {
    pos.i++;
    const inner = parseExpr(tokens, pos);
    if (!inner) return null;
    if (pos.i >= tokens.length || tokens[pos.i].type !== 'rparen') return null;
    pos.i++;
    return inner;
  }
  return null;
}

// =================================================================
// API PUBLICA
// =================================================================

/**
 * Parseia e valida a formula. Retorna AST se valida, erro senao.
 */
export function parseFormula(formula: string): ParseResult {
  if (!formula || typeof formula !== 'string') {
    return { valid: false, error: 'Formula vazia' };
  }
  const tokens = tokenize(formula);
  if (!tokens || tokens.length === 0) {
    return { valid: false, error: 'Formula invalida (caracteres nao suportados)' };
  }
  const pos = { i: 0 };
  const ast = parseExpr(tokens, pos);
  if (!ast || pos.i !== tokens.length) {
    return { valid: false, error: 'Sintaxe invalida' };
  }
  return { valid: true, ast };
}

/**
 * Valida que todas as variaveis da formula estao no contexto permitido.
 */
export function validateVariables(ast: ASTNode, allowed: string[]): string | null {
  const used = collectVariables(ast);
  for (const v of used) {
    if (!allowed.includes(v)) return `Variavel nao permitida: ${v}`;
  }
  return null;
}

function collectVariables(node: ASTNode): string[] {
  if (node.type === 'variable') return [node.name];
  if (node.type === 'number') return [];
  return [...collectVariables(node.left), ...collectVariables(node.right)];
}

/**
 * Avalia a AST com o contexto fornecido.
 * Retorna null em caso de divisao por zero ou variavel ausente.
 */
export function evaluate(ast: ASTNode, ctx: FormulaContext): number | null {
  if (ast.type === 'number') return ast.value;
  if (ast.type === 'variable') {
    const v = ctx[ast.name];
    return typeof v === 'number' ? v : null;
  }
  const left = evaluate(ast.left, ctx);
  const right = evaluate(ast.right, ctx);
  if (left === null || right === null) return null;
  switch (ast.op) {
    case '+': return left + right;
    case '-': return left - right;
    case '*': return left * right;
    case '/': return right === 0 ? null : left / right;
  }
}

/**
 * Lista todas as variaveis usadas na formula (p/ UI mostrar como ajuda).
 */
export function listVariables(ast: ASTNode): string[] {
  return Array.from(new Set(collectVariables(ast)));
}
// =================================================================
// FIM: backend/src/company/domain/formula-engine.ts
// =================================================================