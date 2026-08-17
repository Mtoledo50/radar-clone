// test-skill-pipeline.js — Replica o pipeline da skill com log em cada passo
const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default;
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const STEP = (name) => console.log(`\n[${name}]`);
const FAIL = (err) => { console.error('❌', err?.message || err); if (err?.stack) console.error(err.stack); process.exit(1); };

async function main() {
  const company = await p.company.findFirst();
  const client = await p.client.findFirst({ where: { companyId: company.id, status: 'ATIVO' } });
  if (!client) FAIL('Sem cliente ativo');

  STEP('1) COLETAR: extratos e transações');
  const statements = await p.bankStatement.findMany({
    where: { companyId: company.id, clientId: client.id, year: 2026, month: 7 },
    include: { transactions: true },
  });
  const txs = statements.flatMap((s) => s.transactions || []);
  console.log(`   statements=${statements.length} | txs=${txs.length}`);

  STEP('2) INTERPRETAR: totais + agrupamento');
  let receitas = 0, despesas = 0;
  const byNature = new Map();
  for (const t of txs) {
    const v = Number(t.amount);
    if (v >= 0) receitas += v; else despesas += -v;
    const key = t.nature || 'NAO_CLASSIFICADO';
    const cur = byNature.get(key) || { total: 0, count: 0 };
    cur.total += v; cur.count++;
    byNature.set(key, cur);
  }
  console.log(`   receitas=${receitas} | despesas=${despesas} | natures=${byNature.size}`);

  STEP('3) EXECUTAR: construir PDF');
  const doc = new jsPDF();
  doc.setFillColor(13, 148, 136);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('RADAR CONTA CERTA', 14, 13);
  console.log('   cabeçalho ok');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(12);
  doc.text(client.companyName, 14, 42);
  console.log('   identificação ok');

  STEP('4) Tabela 1: resumo financeiro');
  try {
    autoTable(doc, {
      startY: 62,
      head: [['Resumo', 'Valor']],
      body: [
        ['Receitas', `R$ ${receitas.toFixed(2)}`],
        ['Despesas', `R$ ${despesas.toFixed(2)}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] },
    });
    console.log('   tabela 1 ok | finalY=', doc.lastAutoTable?.finalY);
  } catch (e) { FAIL(e); }

  STEP('5) Tabela 2: totais por natureza');
  try {
    const lastY2 = doc.lastAutoTable?.finalY ?? 104;
    const natureRows = Array.from(byNature.entries()).map(([n, v]) => [n, String(v.count), `R$ ${v.total.toFixed(2)}`]);
    autoTable(doc, {
      startY: lastY2 + 6,
      head: [['Natureza', 'Mov.', 'Total']],
      body: natureRows.length ? natureRows : [['Sem movimentações', '-', '-']],
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22] },
    });
    console.log('   tabela 2 ok | finalY=', doc.lastAutoTable?.finalY);
  } catch (e) { FAIL(e); }

  STEP('6) Tabela 3: top 10');
  try {
    const lastY3 = doc.lastAutoTable?.finalY ?? 154;
    const top = [...txs].sort((a, b) => Math.abs(Number(b.amount)) - Math.abs(Number(a.amount))).slice(0, 10);
    const topRows = top.map((t) => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      String(t.description || '').slice(0, 60),
      `R$ ${Number(t.amount).toFixed(2)}`,
    ]);
    autoTable(doc, {
      startY: lastY3 + 6,
      head: [['Data', 'Descrição', 'Valor']],
      body: topRows.length ? topRows : [['Sem movimentações', '-', '-']],
    });
    console.log('   tabela 3 ok | finalY=', doc.lastAutoTable?.finalY);
  } catch (e) { FAIL(e); }

  STEP('7) Rodapé');
  const finalY = doc.lastAutoTable?.finalY ?? 250;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Gerado pela Aurora - documento informativo (Regra de Ouro ADR-030)', 14, Math.min(finalY + 12, 285));
  console.log('   rodapé ok');

  STEP('8) Salvar arquivo');
  try {
    const dir = path.join(process.cwd(), 'uploads', 'reports', company.id, '2026-07');
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${client.id}.pdf`);
    const buf = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(filePath, buf);
    console.log(`   ✅ Arquivo salvo: ${filePath} (${buf.length} bytes)`);
  } catch (e) { FAIL(e); }

  STEP('9) Upsert no MonthlyReport');
  try {
    const summary = { receitas, despesas, saldo: receitas - despesas, txCount: txs.length };
    await p.monthlyReport.upsert({
      where: { companyId_clientId_period: { companyId: company.id, clientId: client.id, period: '2026-07' } },
      update: { status: 'READY', pdfPath: `reports/${company.id}/2026-07/${client.id}.pdf`, summary },
      create: { companyId: company.id, clientId: client.id, period: '2026-07', status: 'READY', pdfPath: `reports/${company.id}/2026-07/${client.id}.pdf`, summary },
    });
    console.log('   ✅ MonthlyReport registrado');
  } catch (e) { FAIL(e); }

  STEP('10) Auditoria');
  try {
    await p.automationAudit.create({
      data: { companyId: company.id, actor: 'AURORA', action: 'MONTHLY_REPORT_GENERATED', entity: 'MonthlyReport', entityId: client.id, detail: { period: '2026-07' } },
    });
    console.log('   ✅ Auditoria registrada');
  } catch (e) { FAIL(e); }

  console.log('\n🎉 Pipeline completo! A skill deve funcionar agora.');
}

main().finally(() => p.$disconnect());

