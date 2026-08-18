const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const XML = (num, cnpj) => `<?xml version="1.0" encoding="UTF-8"?>
<CompNfse><Nfse><InfNfse>
  <Numero>${num}</Numero>
  <CodigoVerificacao>ABC${num}</CodigoVerificacao>
  <DataEmissao>2026-07-15T10:30:00</DataEmissao>
  <Competencia>2026-07-15</Competencia>
  <PrestadorServico>
    <IdentificacaoPrestador><Cnpj>${cnpj}</Cnpj></IdentificacaoPrestador>
    <RazaoSocial>PRESTADOR ${num} LTDA</RazaoSocial>
  </PrestadorServico>
  <TomadorServico>
    <IdentificacaoTomador><CpfCnpj><Cnpj>98765432000100</Cnpj></CpfCnpj></IdentificacaoTomador>
    <RazaoSocial>TOMADOR X</RazaoSocial>
  </TomadorServico>
  <Servico>
    <Valores>
      <ValorServicos>1500.00</ValorServicos>
      <BaseCalculo>1500.00</BaseCalculo>
      <Aliquota>0.03</Aliquota>
      <ValorIss>45.00</ValorIss>
      <IssRetido>false</IssRetido>
    </Valores>
    <ItemListaServico>17.01</ItemListaServico>
    <Discriminacao>Servico tecnico ${num}</Discriminacao>
    <CodigoMunicipio>4314902</CodigoMunicipio>
  </Servico>
</InfNfse></Nfse></CompNfse>`;

async function main() {
  const company = await p.company.findFirst();
  const client = await p.client.findFirst({ where: { companyId: company.id } });
  const dir = path.join(process.cwd(), 'uploads', 'nfse-inbox');
  fs.mkdirSync(dir, { recursive: true });

  // XML 1: vinculado ao cliente (vai p/ IMPORTED / auto)
  fs.writeFileSync(path.join(dir, `${company.id}_${client.id}_${Date.now()}.xml`), XML(1001, '11222333000144'));
  // XML 2: sem vínculo (vai p/ fila 🟡 REVIEW)
  fs.writeFileSync(path.join(dir, `${company.id}_auto_${Date.now() + 1}.xml`), XML(1002, '55666777000188'));

  console.log('✅ 2 XMLs na caixa de entrada:');
  console.log('   1) vinculado a', client.companyName, '→ esperado IMPORTED');
  console.log('   2) sem vínculo → esperado REVIEW (fila 🟡)');
}
main().finally(() => p.$disconnect());
