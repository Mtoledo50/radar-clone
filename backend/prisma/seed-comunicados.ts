// backend/prisma/seed-comunicados.ts
// Rodar: npx ts-node prisma/seed-comunicados.ts
import { PrismaClient, TipoDocumentoComunicado } from '@prisma/client';

const prisma = new PrismaClient();

const LOGO_PLACEHOLDER = 'https://via.placeholder.com/180x50/0a66c2/ffffff?text=Conta+Certa';

const templates = [
  {
    tipoDocumento: TipoDocumentoComunicado.DAS,
    nome: 'DAS (Simples Nacional)',
    assunto: 'Guia DAS {{documento.competencia}} — {{cliente.nome}}',
    corpoHtml: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#f9f9f9">
  <div style="background:#fff;padding:24px;border-radius:8px">
    <h2 style="color:#0a66c2;margin-top:0">Olá, {{cliente.nome}}!</h2>
    <p>Segue em anexo a guia <strong>DAS</strong> referente à competência <strong>{{documento.competencia}}</strong>.</p>
    <p>Por favor, realize o pagamento até o vencimento indicado na guia.</p>
    <p style="margin:24px 0">
      <a href="{{link.download}}" style="background:#0a66c2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">📥 Baixar documento</a>
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="color:#666;font-size:12px;margin:0">
      Link válido até {{link.expiraEm}}.<br/>
      <strong>{{empresa.nome}}</strong> — {{setor.nome}}
    </p>
  </div>
</div>`.trim(),
  },
  {
    tipoDocumento: TipoDocumentoComunicado.DARF,
    nome: 'DARF (Impostos Federais)',
    assunto: 'DARF {{documento.competencia}} — {{cliente.nome}}',
    corpoHtml: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#f9f9f9">
  <div style="background:#fff;padding:24px;border-radius:8px">
    <h2 style="color:#0a66c2;margin-top:0">Olá, {{cliente.nome}}!</h2>
    <p>Segue em anexo o <strong>DARF</strong> referente à competência <strong>{{documento.competencia}}</strong>.</p>
    <p style="margin:24px 0">
      <a href="{{link.download}}" style="background:#0a66c2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">📥 Baixar documento</a>
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="color:#666;font-size:12px;margin:0">
      Link válido até {{link.expiraEm}}.<br/>
      <strong>{{empresa.nome}}</strong> — {{setor.nome}}
    </p>
  </div>
</div>`.trim(),
  },
  {
    tipoDocumento: TipoDocumentoComunicado.ISS,
    nome: 'ISS (Imposto Sobre Serviços)',
    assunto: 'Guia ISS {{documento.competencia}} — {{cliente.nome}}',
    corpoHtml: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#f9f9f9">
  <div style="background:#fff;padding:24px;border-radius:8px">
    <h2 style="color:#0a66c2;margin-top:0">Olá, {{cliente.nome}}!</h2>
    <p>Segue em anexo a guia de <strong>ISS</strong> referente à competência <strong>{{documento.competencia}}</strong>.</p>
    <p style="margin:24px 0">
      <a href="{{link.download}}" style="background:#0a66c2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">📥 Baixar documento</a>
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="color:#666;font-size:12px;margin:0">
      Link válido até {{link.expiraEm}}.<br/>
      <strong>{{empresa.nome}}</strong> — {{setor.nome}}
    </p>
  </div>
</div>`.trim(),
  },
  {
    tipoDocumento: TipoDocumentoComunicado.FGTS,
    nome: 'FGTS / SEFIP',
    assunto: 'Guia FGTS {{documento.competencia}} — {{cliente.nome}}',
    corpoHtml: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#f9f9f9">
  <div style="background:#fff;padding:24px;border-radius:8px">
    <h2 style="color:#0a66c2;margin-top:0">Olá, {{cliente.nome}}!</h2>
    <p>Segue em anexo a guia de <strong>FGTS</strong> referente à competência <strong>{{documento.competencia}}</strong>.</p>
    <p style="margin:24px 0">
      <a href="{{link.download}}" style="background:#0a66c2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">📥 Baixar documento</a>
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="color:#666;font-size:12px;margin:0">
      Link válido até {{link.expiraEm}}.<br/>
      <strong>{{empresa.nome}}</strong> — {{setor.nome}}
    </p>
  </div>
</div>`.trim(),
  },
  {
    tipoDocumento: TipoDocumentoComunicado.IRPF,
    nome: 'IRPF (Imposto de Renda PF)',
    assunto: 'DARF IRPF {{documento.competencia}} — {{cliente.nome}}',
    corpoHtml: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#f9f9f9">
  <div style="background:#fff;padding:24px;border-radius:8px">
    <h2 style="color:#0a66c2;margin-top:0">Olá, {{cliente.nome}}!</h2>
    <p>Segue em anexo o DARF de <strong>IRPF</strong> referente à competência <strong>{{documento.competencia}}</strong>.</p>
    <p style="margin:24px 0">
      <a href="{{link.download}}" style="background:#0a66c2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">📥 Baixar documento</a>
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="color:#666;font-size:12px;margin:0">
      Link válido até {{link.expiraEm}}.<br/>
      <strong>{{empresa.nome}}</strong> — {{setor.nome}}
    </p>
  </div>
</div>`.trim(),
  },
  {
    tipoDocumento: TipoDocumentoComunicado.BALANCETE,
    nome: 'Balancete / Razão',
    assunto: 'Balancete {{documento.competencia}} — {{cliente.nome}}',
    corpoHtml: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#f9f9f9">
  <div style="background:#fff;padding:24px;border-radius:8px">
    <h2 style="color:#0a66c2;margin-top:0">Olá, {{cliente.nome}}!</h2>
    <p>Segue em anexo o <strong>Balancete</strong> referente à competência <strong>{{documento.competencia}}</strong>.</p>
    <p style="margin:24px 0">
      <a href="{{link.download}}" style="background:#0a66c2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">📥 Baixar documento</a>
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="color:#666;font-size:12px;margin:0">
      Link válido até {{link.expiraEm}}.<br/>
      <strong>{{empresa.nome}}</strong> — {{setor.nome}}
    </p>
  </div>
</div>`.trim(),
  },
  {
    tipoDocumento: TipoDocumentoComunicado.INFORME_RENDIMENTO,
    nome: 'Informe de Rendimentos',
    assunto: 'Informe de Rendimentos {{documento.competencia}} — {{cliente.nome}}',
    corpoHtml: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#f9f9f9">
  <div style="background:#fff;padding:24px;border-radius:8px">
    <h2 style="color:#0a66c2;margin-top:0">Olá, {{cliente.nome}}!</h2>
    <p>Segue em anexo o <strong>Informe de Rendimentos</strong> referente ao ano-base <strong>{{documento.competencia}}</strong>.</p>
    <p style="margin:24px 0">
      <a href="{{link.download}}" style="background:#0a66c2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">📥 Baixar documento</a>
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="color:#666;font-size:12px;margin:0">
      Link válido até {{link.expiraEm}}.<br/>
      <strong>{{empresa.nome}}</strong> — {{setor.nome}}
    </p>
  </div>
</div>`.trim(),
  },
  {
    tipoDocumento: TipoDocumentoComunicado.GENERICO,
    nome: 'Documento Genérico (fallback)',
    assunto: 'Documento {{documento.competencia}} — {{cliente.nome}}',
    corpoHtml: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#f9f9f9">
  <div style="background:#fff;padding:24px;border-radius:8px">
    <h2 style="color:#0a66c2;margin-top:0">Olá, {{cliente.nome}}!</h2>
    <p>Segue em anexo o documento <strong>{{documento.tipo}}</strong> referente à competência <strong>{{documento.competencia}}</strong>.</p>
    <p style="margin:24px 0">
      <a href="{{link.download}}" style="background:#0a66c2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">📥 Baixar documento</a>
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="color:#666;font-size:12px;margin:0">
      Link válido até {{link.expiraEm}}.<br/>
      <strong>{{empresa.nome}}</strong> — {{setor.nome}}
    </p>
  </div>
</div>`.trim(),
  },
];

async function seed(companyId?: string) {
  // Se não passar companyId, cria em todas as companies existentes
  const companies = companyId
    ? await prisma.company.findMany({ where: { id: companyId } })
    : await prisma.company.findMany();

  if (companies.length === 0) {
    console.error('❌ Nenhuma company encontrada. Passe o companyId como argumento:');
    console.error('   npx ts-node prisma/seed-comunicados.ts <companyId>');
    return;
  }

  for (const company of companies) {
    console.log(`\n📦 Seedando templates para: ${company.name || company.id}`);
    for (const t of templates) {
      const existing = await prisma.emailTemplate.findUnique({
        where: { companyId_tipoDocumento: { companyId: company.id, tipoDocumento: t.tipoDocumento } },
      });
      if (existing) {
        console.log(`   ⏭️  ${t.tipoDocumento} já existe, pulando`);
        continue;
      }
      await prisma.emailTemplate.create({
        data: { companyId: company.id, ...t },
      });
      console.log(`   ✅ ${t.tipoDocumento}`);
    }
  }
  console.log('\n🎉 Seed concluído!');
}

seed(process.argv[2]).catch(console.error).finally(() => prisma.$disconnect());