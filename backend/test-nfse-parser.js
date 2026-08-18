const { parseNfse, NfseParseError } = require('./dist/fiscal/nfse/nfse.parser.js');

const XML_OK = `<?xml version="1.0" encoding="UTF-8"?>
<CompNfse>
  <Nfse>
    <InfNfse Id="nfse-123">
      <Numero>2026000123</Numero>
      <CodigoVerificacao>ABC1-DEF2-GHI3</CodigoVerificacao>
      <DataEmissao>2026-07-15T10:30:00</DataEmissao>
      <Competencia>2026-07-15</Competencia>
      <PrestadorServico>
        <IdentificacaoPrestador>
          <Cnpj>12345678000190</Cnpj>
        </IdentificacaoPrestador>
        <RazaoSocial>CONTABILIDADE SILVA LTDA</RazaoSocial>
      </PrestadorServico>
      <TomadorServico>
        <IdentificacaoTomador>
          <CpfCnpj>
            <Cnpj>98765432000100</Cnpj>
          </CpfCnpj>
        </IdentificacaoTomador>
        <RazaoSocial>XCL PAISAGISMO LTDA</RazaoSocial>
      </TomadorServico>
      <Servico>
        <Valores>
          <ValorServicos>2500.00</ValorServicos>
          <ValorDeducoes>0</ValorDeducoes>
          <BaseCalculo>2500.00</BaseCalculo>
          <Aliquota>0.035</Aliquota>
          <ValorIss>87.50</ValorIss>
          <IssRetido>false</IssRetido>
        </Valores>
        <ItemListaServico>17.01</ItemListaServico>
        <Discriminacao>Servicos de contabilidade - julho/2026</Discriminacao>
        <CodigoMunicipio>4314902</CodigoMunicipio>
      </Servico>
    </InfNfse>
  </Nfse>
</CompNfse>`;

const XML_SEM_TOMADOR = `<?xml version="1.0"?>
<CompNfse><Nfse><InfNfse>
  <Numero>999</Numero>
  <DataEmissao>2026-07-20T08:00:00</DataEmissao>
  <PrestadorServico>
    <IdentificacaoPrestador><Cnpj>12345678000190</Cnpj></IdentificacaoPrestador>
    <RazaoSocial>EMPRESA X</RazaoSocial>
  </PrestadorServico>
  <Servico>
    <Valores>
      <ValorServicos>1000</ValorServicos>
      <Aliquota>0.05</Aliquota>
      <ValorIss>50</ValorIss>
    </Valores>
    <ItemListaServico>01.01</ItemListaServico>
    <Discriminacao>Consultoria generica</Discriminacao>
  </Servico>
</InfNfse></Nfse></CompNfse>`;

const XML_RUIM = `<CompNfse><Nfse>...</CompNfse>`;

const XML_SEM_NUMERO = `<CompNfse><Nfse><InfNfse>
  <DataEmissao>2026-07-15</DataEmissao>
  <PrestadorServico>
    <IdentificacaoPrestador><Cnpj>12345678000190</Cnpj></IdentificacaoPrestador>
    <RazaoSocial>X</RazaoSocial>
  </PrestadorServico>
  <Servico><Valores><ValorServicos>100</ValorServicos></Valores></Servico>
</InfNfse></Nfse></CompNfse>`;

console.log('=== TESTE 1: XML válido (ABRASF 2.0) ===');
try {
  const r = parseNfse(XML_OK);
  console.log('✅ Parseou com sucesso:');
  console.log('   Número:', r.number);
  console.log('   Emissão:', r.emissionDate.toISOString());
  console.log('   Prestador:', r.issuerName, '-', r.issuerCnpj);
  console.log('   Tomador:', r.takerName, '-', r.takerCnpj);
  console.log('   Valor:', r.serviceValue.toFixed(2));
  console.log('   ISS:', r.issRate.toFixed(2) + '% =', r.issValue.toFixed(2), '| Retido?', r.issRetained);
  console.log('   Serviço:', r.serviceCode, '-', r.serviceDescription);
  console.log('   Município IBGE:', r.municipalityCode);
} catch (e) {
  console.log('❌ FALHOU:', e.message);
  process.exit(1);
}

console.log('\n=== TESTE 2: XML sem tomador (válido) ===');
try {
  const r = parseNfse(XML_SEM_TOMADOR);
  console.log('✅ Parseou. Tomador:', r.takerName || '(nenhum)');
  if (r.takerName) { console.log('❌ Deveria estar vazio'); process.exit(1); }
} catch (e) {
  console.log('❌ FALHOU:', e.message);
  process.exit(1);
}

console.log('\n=== TESTE 3: XML malformado (deve falhar) ===');
try {
  parseNfse(XML_RUIM);
  console.log('❌ Deveria ter lançado NfseParseError');
  process.exit(1);
} catch (e) {
  if (e instanceof NfseParseError) {
    console.log('✅ Falhou como esperado:', e.message);
  } else {
    console.log('❌ Erro inesperado:', e.message);
    process.exit(1);
  }
}

console.log('\n=== TESTE 4: XML sem número (deve falhar apontando campo) ===');
try {
  parseNfse(XML_SEM_NUMERO);
  console.log('❌ Deveria ter lançado NfseParseError');
  process.exit(1);
} catch (e) {
  if (e instanceof NfseParseError && e.message.includes('Número')) {
    console.log('✅ Falhou apontando o campo:', e.message);
  } else {
    console.log('❌ Erro inesperado:', e.message);
    process.exit(1);
  }
}

console.log('\n🎉 TODOS OS TESTES PASSARAM! Parser pronto para plugar na skill.');