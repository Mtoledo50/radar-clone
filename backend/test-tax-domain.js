const { calcDasSimples, ANEXO_III } = require('./dist/tax/domain/simples-nacional.js');
const { calcIss } = require('./dist/tax/domain/iss.js');

let ok = 0;
const assert = (cond, msg) => {
  if (cond) { ok++; console.log('✅', msg); }
  else { console.log('❌', msg); process.exit(1); }
};

console.log('=== TESTE 1: DAS — RBT12 250mil (faixa 2, efetiva 5.8%) ===');
const r1 = calcDasSimples(1500, 250000);
assert(r1.bracketIndex === 2, 'faixa 2');
assert(r1.effectiveRate === 5.8, 'efetiva 5.8% (got ' + r1.effectiveRate + ')');
assert(r1.dasValue === 87, 'DAS R$ 87.00 (got ' + r1.dasValue + ')');
console.log(r1.steps.join('\n'));

console.log('\n=== TESTE 2: DAS — RBT12 100mil (faixa 1, 6%) ===');
const r2 = calcDasSimples(2000, 100000);
assert(r2.bracketIndex === 1 && r2.dasValue === 120, 'faixa 1 → R$ 120.00');

console.log('\n=== TESTE 3: DAS — RBT12 acima do teto (deve falhar) ===');
try { calcDasSimples(1000, 5000000); console.log('❌ deveria falhar'); process.exit(1); }
catch (e) { assert(String(e.message).includes('teto'), 'falhou apontando teto'); }

console.log('\n=== TESTE 4: ISS — próprio × retido ===');
const r4 = calcIss([
  { id: 'a', number: '101', issBase: 1000, issRate: 3, issRetained: false },
  { id: 'b', number: '102', issBase: 2000, issRate: 5, issRetained: true },
]);
assert(r4.issPayable === 30, 'ISS próprio R$ 30 (1000×3%)');
assert(r4.issRetainedTotal === 100, 'retido R$ 100 (2000×5%)');
assert(r4.count === 2, '2 NFS-e');

console.log('\n=== TESTE 5: ISS — alíquota 0 sem retenção (warning 🟡) ===');
const r5 = calcIss([{ id: 'c', number: '103', issBase: 500, issRate: 0, issRetained: false }]);
assert(r5.warnings.length === 1, '1 warning gerado');

console.log('\n🎉 TODOS OS TESTES DO FD-4 PASSARAM!');