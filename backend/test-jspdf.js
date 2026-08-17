// test-jspdf.js — testa geração de PDF simples sem a skill
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default;

try {
  const doc = new jsPDF();
  doc.setFillColor(13, 148, 136);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TESTE AURORA', 14, 13);

  autoTable(doc, {
    startY: 40,
    head: [['Col1', 'Col2']],
    body: [['A', 'B'], ['C', 'D']],
  });

  doc.save('test-aurora.pdf');
  console.log('✅ PDF gerado com sucesso!');
  console.log('Arquivo: C:\\radar-clone\\backend\\test-aurora.pdf');
} catch (e) {
  console.error('❌ Erro:', e.message);
  console.error(e.stack);
}
