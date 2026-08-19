// =================================================================
// INÍCIO: frontend/src/lib/proposal-png.ts
// =================================================================
/**
 * =================================================================
 * proposal-png.ts — Sprint A6 (PNG da Capa p/ WhatsApp)
 * =================================================================
 * Card 1080×1350 px via Canvas 2D nativo (ADR-046) — sem html2canvas.
 *
 * 🖼️ LOGO HORIZONTAL (A6.1): desenhado em chip branco com proporção
 * original (contain), nunca clipado em círculo.
 * =================================================================
 */
import type { PdfBranding, PdfProposal } from './proposal-pdf';

const CW = 1080;
const CH = 1350;

// =================================================================
// 🔧 HELPERS
// =================================================================
function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const rgb = (hex: string, a = 1) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};

function shade(hex: string, f: number) {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}

function brl(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if ('roundRect' in ctx) {
    (ctx as any).roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

async function loadLogo(url?: string | null): Promise<HTMLImageElement | null> {
  if (!url) return null;
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('logo'));
    });
    return img;
  } catch {
    return null;
  }
}

// =================================================================
// 🎯 GERADOR DO CARD
// =================================================================
export async function generateProposalPng(
  proposal: PdfProposal,
  branding: PdfBranding,
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = CW;
  canvas.height = CH;
  const ctx = canvas.getContext('2d')!;

  const total = proposal.items.reduce((s, i) => s + (i.price || 0), 0);
  const logo = await loadLogo(branding.logoUrl);

  // Fundo primário + círculos decorativos
  ctx.fillStyle = rgb(branding.primaryColor);
  ctx.fillRect(0, 0, CW, CH);
  ctx.fillStyle = shade(branding.primaryColor, 0.8);
  ctx.beginPath();
  ctx.arc(60, CH - 90, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgb(branding.secondaryColor);
  ctx.beginPath();
  ctx.arc(CW - 70, 110, 150, 0, Math.PI * 2);
  ctx.fill();

  if (logo) {
    // 🖼️ A6.1 — chip branco + logo horizontal proporcional (máx 620×200)
    const r = Math.min(620 / logo.naturalWidth, 200 / logo.naturalHeight);
    const lw = logo.naturalWidth * r;
    const lh = logo.naturalHeight * r;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, CW / 2 - lw / 2 - 28, 150, lw + 56, lh + 56, 28);
    ctx.fill();
    ctx.drawImage(logo, CW / 2 - lw / 2, 178, lw, lh);
  } else {
    // Fallback: círculo com inicial
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(CW / 2, 250, 105, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgb(branding.primaryColor);
    ctx.font = 'bold 120px system-ui, Segoe UI, Roboto, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((branding.companyName || 'E').charAt(0).toUpperCase(), CW / 2, 262);
    ctx.textBaseline = 'alphabetic';
  }

  // Identidade
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px system-ui, Segoe UI, Roboto, Arial';
  ctx.fillText(branding.companyName, CW / 2, 440);
  ctx.fillStyle = rgb(branding.secondaryColor);
  ctx.fillRect(CW / 2 - 70, 470, 140, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '500 34px system-ui, Segoe UI, Roboto, Arial';
  ctx.fillText('P R O P O S T A   C O M E R C I A L', CW / 2, 540);

  // Cliente (com quebra de linha)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 76px system-ui, Segoe UI, Roboto, Arial';
  const clientLines = wrapText(ctx, proposal.clientName, CW - 160).slice(0, 2);
  clientLines.forEach((line, i) => ctx.fillText(line, CW / 2, 660 + i * 92));
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '400 32px system-ui, Segoe UI, Roboto, Arial';
  ctx.fillText(proposal.proposalNumber, CW / 2, 660 + clientLines.length * 92 + 20);

  // Card branco do investimento
  const cardY = CH - 420;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 80, cardY, CW - 160, 280, 28);
  ctx.fill();
  ctx.fillStyle = '#64748b';
  ctx.font = '500 34px system-ui, Segoe UI, Roboto, Arial';
  ctx.fillText('INVESTIMENTO MENSAL', CW / 2, cardY + 80);
  ctx.fillStyle = rgb(branding.primaryColor);
  ctx.font = 'bold 108px system-ui, Segoe UI, Roboto, Arial';
  ctx.fillText(brl(total), CW / 2, cardY + 190);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '400 30px system-ui, Segoe UI, Roboto, Arial';
  ctx.fillText(`${proposal.items.length} serviço(s) incluso(s) • validade 15 dias`, CW / 2, cardY + 245);

  // Rodapé
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '400 28px system-ui, Segoe UI, Roboto, Arial';
  ctx.fillText(branding.proposalFooterText || 'Gerado por Radar Conta Certa', CW / 2, CH - 70);

  return canvas.toDataURL('image/png');
}

// =================================================================
// 💾 DOWNLOAD HELPER
// =================================================================
export function downloadPng(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
// =================================================================
// FIM: frontend/src/lib/proposal-png.ts
// =================================================================