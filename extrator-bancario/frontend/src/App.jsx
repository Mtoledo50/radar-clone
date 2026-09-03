import { useState } from 'react';
import FileUpload from './components/FileUpload';
import LancamentosTable from './components/LancamentosTable';
import { parseExtrato, classificarLancamentos, gerarCSV, getDownloadURL } from './services/api';
import './App.css';

/**
 * Componente Principal - Extrator Bancário
 * 
 * Fluxo:
 * 1. Usuário faz upload do PDF
 * 2. Backend extrai os lançamentos
 * 3. Sistema classifica automaticamente (matching com histórico)
 * 4. Usuário revisa/edita lançamentos pendentes
 * 5. Gera CSV no formato Aurora para importação no sistema contábil
 */
function App() {
  // Estados do componente
  const [extrato, setExtrato] = useState(null);        // Dados do extrato processado
  const [loading, setLoading] = useState(false);        // Indicador de carregamento
  const [error, setError] = useState(null);             // Mensagem de erro
  const [csvUrl, setCsvUrl] = useState(null);           // URL para download do CSV

  /**
   * Handler principal - Processa o arquivo PDF enviado pelo usuário
   * @param {File} file - Arquivo PDF do extrato bancário
   */
  const handleFileSelect = async (file) => {
    console.log("📤 Novo arquivo selecionado:", file.name);
    
    // Reset de estados anteriores
    setLoading(true);
    setError(null);
    setCsvUrl(null);
    setExtrato(null); // Limpa extrato anterior para forçar re-renderização

    try {
      // PASSO 1: Parse do PDF (extração dos dados brutos)
      console.log(" Passo 1: Extraindo dados do PDF...");
      const parseResult = await parseExtrato(file);
      
      if (!parseResult.success) {
        throw new Error(parseResult.message || 'Erro ao processar PDF');
      }
      
      console.log("✅ PDF parseado:", parseResult.data.banco, "- Lancamentos:", parseResult.data.lancamentos.length);

      // PASSO 2: Classificação automática (matching com histórico + regras)
      console.log("🔍 Passo 2: Classificando lançamentos...");
      const classifyResult = await classificarLancamentos(parseResult.data);
      
      if (!classifyResult.success) {
        throw new Error(classifyResult.message || 'Erro ao classificar');
      }
      
      console.log("✅ Classificação concluída:");
      console.log("   - Matches automáticos:", classifyResult.summary.matches);
      console.log("   - Para revisão:", classifyResult.summary.revisoes);

      // PASSO 3: Atualiza estado com extrato classificado
      console.log("📊 Atualizando estado com dados processados...");
      setExtrato(classifyResult.data);
      
      // Scroll suave para o topo para mostrar o resumo
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      
    } catch (err) {
      // Tratamento de erro
      console.error("❌ Erro no processamento:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handler para edição manual de lançamentos
   * Permite que o usuário altere as contas de débito/crédito
   * @param {number} index - Índice do lançamento na lista
   * @param {object} values - Novos valores {conta_debito, conta_credito}
   */
  const handleEditar = (index, values) => {
    // Cria cópia imutável do extrato
    const updated = { ...extrato };
    
    // Atualiza o lançamento específico
    updated.lancamentos[index].conta_debito = values.conta_debito;
    updated.lancamentos[index].conta_credito = values.conta_credito;
    updated.lancamentos[index].status = 'aprovado'; // Marca como aprovado após edição
    
    // Atualiza estado (trigger re-render)
    setExtrato(updated);
    
    console.log(`✏️ Lançamento ${index} atualizado: D=${values.conta_debito} C=${values.conta_credito}`);
  };

  /**
   * Handler para geração do CSV no formato Aurora
   * Envia apenas lançamentos aprovados (com D/C definidos)
   */
  const handleGerarCSV = async () => {
    setLoading(true);
    
    try {
      console.log("📥 Gerando CSV Aurora...");
      const result = await gerarCSV(extrato);
      
      if (result.success) {
        // Obtém URL de download
        const downloadUrl = getDownloadURL(result.data.filename);
        setCsvUrl(downloadUrl);
        console.log("✅ CSV gerado:", result.data.filename);
      } else {
        throw new Error(result.message || 'Erro ao gerar CSV');
      }
    } catch (err) {
      console.error("❌ Erro ao gerar CSV:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Cabeçalho */}
      <h1>🏦 Extrator Bancário</h1>
      
      {/* Área de Upload */}
      <FileUpload onFileSelect={handleFileSelect} />

      {/* Indicador de Carregamento */}
      {loading && (
        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '18px' }}>
          ⏳ Processando...
        </p>
      )}
      
      {/* Mensagem de Erro */}
      {error && (
        <p style={{ 
          marginTop: '20px', 
          color: 'red', 
          backgroundColor: '#ffe6e6', 
          padding: '15px', 
          borderRadius: '8px',
          border: '1px solid #ffcccc'
        }}>
          ❌ Erro: {error}
        </p>
      )}

      {/* Resumo e Tabela (só aparece após processamento) */}
      {extrato && (
        <>
          {/* Card de Resumo */}
          <div style={{ 
            marginTop: '20px', 
            padding: '20px', 
            backgroundColor: '#f0f8ff', 
            borderRadius: '8px',
            border: '1px solid #b3d1ff'
          }}>
            <h3 style={{ marginTop: 0 }}>📊 Resumo do Extrato</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '10px' 
            }}>
              <p><strong>Banco:</strong> {extrato.banco}</p>
              <p><strong>Agência:</strong> {extrato.agencia}</p>
              <p><strong>Conta:</strong> {extrato.conta}</p>
              <p><strong>Competência:</strong> {extrato.competencia}</p>
              <p><strong>Total de lançamentos:</strong> {extrato.lancamentos.length}</p>
            </div>
          </div>

          {/* Tabela de Lançamentos */}
          <LancamentosTable
            lancamentos={extrato.lancamentos}
            onEditar={handleEditar}
          />

          {/* Botões de Ação */}
          <div style={{ marginTop: '30px', textAlign: 'center', paddingBottom: '40px' }}>
            <button
              onClick={handleGerarCSV}
              style={{
                padding: '15px 30px',
                fontSize: '16px',
                fontWeight: 'bold',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
            >
              📥 Gerar CSV para o SaaS
            </button>

            {/* Link de Download (aparece após geração do CSV) */}
            {csvUrl && (
              <a
                href={csvUrl}
                download
                style={{
                  marginLeft: '15px',
                  padding: '15px 30px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: '#007bff',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  display: 'inline-block',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
              >
                💾 Baixar Arquivo CSV
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;