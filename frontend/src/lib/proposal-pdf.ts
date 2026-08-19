// =================================================================
// INÍCIO: frontend/src/lib/proposal-pdf.ts
// =================================================================
/**
 * =================================================================
 * proposal-pdf.ts — Sprint A6 (PDF v2 Premium da Proposta)
 * =================================================================
 * Gera o PDF white-label da proposta, 100% no cliente (ADR-045).
 *
 * 📐 Estrutura: capa colorida → sumário (pág. 2) → resumo c/ gráfico
 * de barras → tabela de itens → seções de texto → rodapé numerado.
 *
 * 🖼️ LOGO HORIZONTAL (A6.1): o logo oficial é desenhado em um
 * "chip" branco com a proporção original preservada (contain),
 * NUNCA esticado nem cortado em círculo. Sem logo → inicial.
 * =================================================================
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// =================================================================
// 📋 TIPOS DE ENTRADA
// =================================================================
export interface PdfBranding {
  companyName: string;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  proposalFooterText?: string | null;
}

export interface PdfProposalItem {
  name: string;
  kind: 'PLANO' | 'AVULSO';
  category?: string | null;
  description?: string | null;
  scope?: string | null;
  price: number;
}

export interface PdfProposal {
  proposalNumber: string;
  clientName: string;
  clientCnpj?: string | null;
  taxRegime: string;
  activity?: string | null;
  monthlyRevenue?: number;
  employeeCount?: number;
  aboutOffice?: string | null;
  differentials?: string | null;
  onboarding?: string | null;
  commercialTerms?: string | null;
  specificNote?: string | null;
  createdAt: string;
  items: PdfProposalItem[];
}

// =================================================================
// 📐 CONSTANTES DE LAYOUT (A4 em mm)
// =================================================================
const W = 210;
const H = 297;
const M = 14;
const CONTENT_W = W - M * 2;
const FOOTER_Y = H - 10;

type Rgb = [number, number, number];

// =================================================================
// 🔧 HELPERS DE COR / FORMATO
// =================================================================
function hexToRgb(hex: string): Rgb {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mistura com branco (t = 0..1) — fundos suaves. */
function tint(hex: string, t: number): Rgb {
  const [r, g, b] = hexToRgb(hex);
  const f = (c: number) => Math.round(c + (255 - c) * t);
  return [f(r), f(g), f(b)];
}

/** Escurece (fator 0..1) — detalhes decorativos. */
function shade(hex: string, f: number): Rgb {
  const [r, g, b] = hexToRgb(hex);
  return [Math.round(r * f), Math.round(g * f), Math.round(b * f)];
}

function brl(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}

function dateBR(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

// =================================================================
// 🖼️ LOGO — carrega com dimensões reais p/ desenhar sem distorcer
// =================================================================
interface LogoAsset { dataUrl: string; width: number; height: number }

async function loadLogo(url?: string | null): Promise<LogoAsset | null> {
  if (!url) return null;
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('logo'));
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d')!.drawImage(img, 0, 0);
    return {
      dataUrl: canvas.toDataURL('image/png'),
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
  } catch {
    return null; // tolerante: PDF sai sem logo, nunca quebra
  }
}

/** Contain-fit: encaixa w×h dentro de maxW×maxH preservando proporção. */
function fitRatio(w: number, h: number, maxW: number, maxH: number): [number, number] {
  const r = Math.min(maxW / w, maxH / h);
  return [w * r, h * r];
}

// =================================================================
// 🎯 GERADOR PRINCIPAL
// =================================================================
export async function generateProposalPdf(
  proposal: PdfProposal,
  branding: PdfBranding,
): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const primary = hexToRgb(branding.primaryColor);
  const secondary = hexToRgb(branding.secondaryColor);
  const primaryDark = shade(branding.primaryColor, 0.75);

  const toc: Array<{ title: string; page: number }> = [];
  let y = 0;

  const logo = await loadLogo(branding.logoUrl);

  // -----------------------------------------------------------------
  // PÁGINA 1 — CAPA
  // -----------------------------------------------------------------
  doc.setFillColor(...primary);
  doc.rect(0, 0, W, H, 'F');
  doc.setFillColor(...secondary);
  doc.circle(W - 18, 22, 26, 'F');
  doc.setFillColor(...primaryDark);
  doc.circle(16, H - 30, 34, 'F');

  if (logo) {
    // 🖼️ A6.1 — logo horizontal em chip branco, proporção original
    const [lw, lh] = fitRatio(logo.width, logo.height, 90, 30);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(W / 2 - lw / 2 - 5, 60, lw + 10, lh + 10, 3, 3, 'F');
    doc.addImage(logo.dataUrl, 'PNG', W / 2 - lw / 2, 65, lw, lh);
  } else {
    // Fallback: círculo com inicial
    doc.setFillColor(255, 255, 255);
    doc.circle(W / 2, 78, 22, 'F');
    doc.setTextColor(...primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text((branding.companyName || 'E').charAt(0).toUpperCase(), W / 2, 86, {
      align: 'center',
    });
  }

  // Nome do escritório + selo
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(branding.companyName, W / 2, 112, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('P R O P O S T A   C O M E R C I A L', W / 2, 120, { align: 'center' });

  // Card branco do cliente
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(M, 138, CONTENT_W, 44, 3, 3, 'F');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text('PREPARADA EXCLUSIVAMENTE PARA', M + 8, 148);
  doc.setTextColor(...primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(proposal.clientName, M + 8, 158);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    [
      proposal.clientCnpj ? `CNPJ: ${proposal.clientCnpj}` : '',
      `Regime: ${proposal.taxRegime}`,
      proposal.activity ? `Atividade: ${proposal.activity}` : '',
    ]
      .filter(Boolean)
      .join('  •  '),
    M + 8,
    166,
  );
  doc.text(`Emitida em ${dateBR(proposal.createdAt)}`, M + 8, 174);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primary);
  doc.text(proposal.proposalNumber, W - M - 8, 148, { align: 'right' });

  // Card do investimento (cor de destaque)
  const total = proposal.items.reduce((s, i) => s + (i.price || 0), 0);
  doc.setFillColor(...secondary);
  doc.roundedRect(M, 190, CONTENT_W, 30, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('INVESTIMENTO MENSAL', M + 8, 201);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(brl(total), M + 8, 212);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${proposal.items.length} serviço(s) incluso(s)`, W - M - 8, 212, {
    align: 'right',
  });

  // Rodapé da capa
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(
    branding.proposalFooterText || `${branding.companyName} — gerado por Radar Conta Certa`,
    W / 2,
    H - 10,
    { align: 'center' },
  );

  // -----------------------------------------------------------------
  // PÁGINAS DE CONTEÚDO
  // -----------------------------------------------------------------
  doc.addPage();
  y = 22;

  const runningHeader = () => {
    doc.setFillColor(...primary);
    doc.rect(0, 0, W, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(branding.companyName, M, 8);
    doc.text(proposal.proposalNumber, W - M, 8, { align: 'right' });
  };
  runningHeader();

  const ensure = (h: number) => {
    if (y + h > FOOTER_Y - 6) {
      doc.addPage();
      runningHeader();
      y = 22;
    }
  };

  const section = (title: string) => {
    ensure(16);
    doc.setFillColor(...secondary);
    doc.rect(M, y - 5, 2.5, 7, 'F');
    doc.setTextColor(...primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(title, M + 6, y);
    toc.push({ title, page: doc.getNumberOfPages() });
    y += 7;
  };

  const paragraph = (text: string) => {
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(text, CONTENT_W) as string[];
    for (const line of lines) {
      ensure(6);
      doc.text(line, M, y);
      y += 5.2;
    }
    y += 4;
  };

  // SEÇÃO 1 — RESUMO DO INVESTIMENTO (gráfico de barras)
  section('Resumo do Investimento');
  const top = [...proposal.items].sort((a, b) => b.price - a.price).slice(0, 6);
  const max = Math.max(...top.map((i) => i.price), 1);
  for (const item of top) {
    ensure(12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(doc.splitTextToSize(item.name, 90)[0], M, y + 3);
    const barW = Math.max(6, (item.price / max) * 70);
    doc.setFillColor(...tint(branding.primaryColor, 0.25));
    doc.roundedRect(M + 92, y, 70, 4.5, 1.5, 1.5, 'F');
    doc.setFillColor(...primary);
    doc.roundedRect(M + 92, y, barW, 4.5, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primary);
    doc.text(brl(item.price), W - M, y + 3.8, { align: 'right' });
    y += 9;
  }
  ensure(10);
  doc.setDrawColor(...secondary);
  doc.setLineWidth(0.6);
  doc.line(M, y, W - M, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primary);
  doc.text(`Total mensal: ${brl(total)}`, W - M, y, { align: 'right' });
  y += 10;

  // SEÇÃO 2 — SERVIÇOS INCLUSOS (tabela)
  section('Serviços Inclusos');
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, bottom: 16 },
    head: [['Serviço', 'Tipo', 'Categoria', 'Valor']],
    body: proposal.items.map((i) => [
      i.name,
      i.kind === 'PLANO' ? 'Plano' : 'Avulso',
      i.category || '—',
      brl(i.price),
    ]),
    foot: [['', '', 'TOTAL MENSAL', brl(total)]],
    styles: { fontSize: 9, cellPadding: 2.5, textColor: [71, 85, 105] },
    headStyles: { fillColor: primary, textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: secondary, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: tint(branding.primaryColor, 0.94) },
    columnStyles: {
      0: { cellWidth: 95 },
      1: { cellWidth: 22 },
      2: { cellWidth: 45 },
      3: { cellWidth: 'auto', halign: 'right' },
    },
    didDrawPage: () => runningHeader(),
  });
  y = (doc as any).lastAutoTable?.finalY ?? y;
  y += 10;

  // SEÇÕES DE TEXTO (condicionais)
  if (proposal.aboutOffice) { section('Sobre o Escritório'); paragraph(proposal.aboutOffice); }
  if (proposal.differentials) { section('Nossos Diferenciais'); paragraph(proposal.differentials); }
  if (proposal.onboarding) { section('Como Funciona o Início'); paragraph(proposal.onboarding); }
  if (proposal.commercialTerms) { section('Condições Comerciais'); paragraph(proposal.commercialTerms); }
  if (proposal.specificNote) { section('Observações Importantes'); paragraph(proposal.specificNote); }

  // SUMÁRIO — inserido como página 2
  try {
    (doc as any).insertPage(2);
    doc.setPage(2);
    runningHeader();
    doc.setTextColor(...primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Sumário', M, 26);
    let ty = 38;
    doc.setFontSize(11);
    for (const entry of toc) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(entry.title, M, ty);
      const tw = doc.getTextWidth(entry.title);
      doc.setDrawColor(203, 213, 225);
      doc.setLineDashPattern([0.8, 1.2], 0);
      doc.line(M + tw + 3, ty - 1, W - M - 8, ty - 1);
      doc.setLineDashPattern([], 0);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primary);
      doc.text(String(entry.page), W - M, ty, { align: 'right' });
      ty += 9;
    }
  } catch {
    // insertPage indisponível → segue sem sumário (degradação graciosa)
  }

  // RODAPÉ de todas as páginas (2..N)
  const pages = doc.getNumberOfPages();
  for (let p = 2; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...tint(branding.primaryColor, 0.6));
    doc.setLineWidth(0.3);
    doc.line(M, FOOTER_Y - 4, W - M, FOOTER_Y - 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(branding.proposalFooterText || branding.companyName, M, FOOTER_Y);
    doc.text(`Página ${p} de ${pages}`, W - M, FOOTER_Y, { align: 'right' });
  }

  doc.save(`proposta-${proposal.proposalNumber}.pdf`);
}
// =================================================================
// FIM: frontend/src/lib/proposal-pdf.ts
// =================================================================