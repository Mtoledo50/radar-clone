import { useState } from 'react';
import FileUpload from './components/FileUpload';
import LancamentosTable from './components/LancamentosTable';
import ModalSalvarRegrasLote from './components/ModalSalvarRegrasLote'; // 🆕 NOVO
import { parseExtrato, classificarLancamentos, gerarCSV, getDownloadURL } from './services/api';
import axios from 'axios';
import './App.css';

/**
 * Componente Principal — Extrator Bancário
 * 
 * 🆕 FLUXO OTIMIZADO (Lote no final):
 * 1. Upload do PDF → Extração automática
 * 2. Classificação (Regras Fixas + Aprendidas + Histórico)
 * 3. Usuário revisa/edita lançamentos pendentes (sem modal)
 * 4. No final: botão "💾 Salvar Regras Aprendidas"
 * 5. Modal em lote mostra resumo e confirma
 * 6. Gera CSV para importação no sistema contábil
 */
function App() {
  const [extrato, setExtrato] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [csvUrl, setCsvUrl] = useState(null);
  const [progress, setProgress] = useState('');
  
  // 🆕 NOVO: Modal de regras em lote
  const [modalLoteOpen, setModalLoteOpen] = useState(false);
  const [regrasParaSalvar, setRegrasParaSalvar] = useState([]);

  /**
   * Handler principal — Processa o arquivo PDF enviado
   */
  const handleFileSelect = async (file) => {
    console.log("📤 Novo arquivo selecionado:", file.name);
    
    setLoading(true);
    setError(null);
    setCsvUrl(null);
    setExtrato(null);
    setProgress('📤 Enviando PDF...');

    try {
      setProgress('🔍 Extraindo dados do PDF via Mistral OCR...');
      
      // A API retorna os dados diretamente, sem envelope {success: true}
      const dadosExtrato = await parseExtrato(file);
      
      // Validação correta: verifica se os dados e os lançamentos existem
      if (!dadosExtrato || !dadosExtrato.lancamentos) {
        throw new Error('Resposta inválida do servidor: dados ausentes');
      }

      console.log('✅ PDF parseado com sucesso:', dadosExtrato.banco, 
                  '- Lançamentos:', dadosExtrato.lancamentos.length);

      setProgress('🤖 Classificando lançamentos...');
      
      // Passa os dados diretamente para a classificação
      const classifyResult = await classificarLancamentos(dadosExtrato);
      
      if (!classifyResult || !classifyResult.lancamentos) {
        // Fallback caso a API de classificação também retorne direto
        setExtrato(dadosExtrato);
      } else {
        setExtrato(classifyResult);
      }
      
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setProgress('');
      }, 100);
      
    } catch (err) {
      console.error('❌ Erro no processamento:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('⏱️ Timeout: O processamento demorou muito. Tente um arquivo menor.');
      } else if (err.response) {
        setError(`❌ Erro do servidor: ${err.response.data.detail || err.response.statusText}`);
      } else {
        setError(`❌ Erro: ${err.message}`);
      }
      
      setProgress('');
    } finally {
      setLoading(false);
    }
  };
  /**
   * 🆕 NOVO: Handler para edição manual de lançamentos
   * Agora apenas atualiza o estado, SEM abrir modal
   * Marca o lançamento como "editado_manualmente" para o lote final
   */
  const handleEditar = (index, values) => {
    const updated = { ...extrato };
    
    updated.lancamentos[index].conta_debito = values.conta_debito;
    updated.lancamentos[index].conta_credito = values.conta_credito;
    updated.lancamentos[index].status = 'aprovado';
    updated.lancamentos[index].editado_manualmente = true; //  Flag para identificar edições
    
    setExtrato(updated);
    
    console.log(`✏️ Lançamento ${index} atualizado: D=${values.conta_debito} C=${values.conta_credito}`);
  };

  /**
   *  NOVO: Prepara e abre o modal de salvamento em lote
   * Agrupa lançamentos editados manualmente por tipo+conta
   */
  const handleAbrirModalRegras = () => {
    if (!extrato) return;

    // Filtra apenas lançamentos editados manualmente
    const editados = extrato.lancamentos.filter(l => l.editado_manualmente);
    
    if (editados.length === 0) {
      alert('️ Nenhum lançamento foi editado manualmente. Edite pelo menos um lançamento para salvar regras.');
      return;
    }

      // Agrupa por tipo (para evitar regras duplicadas)
  const regrasAgrupadas = {};
  editados.forEach(lanc => {
    // 🛡️ CORREÇÃO: Remove espaços invisíveis da conta e do tipo
    const contaLimpa = extrato.conta ? String(extrato.conta).replace(/\s+/g, '') : 'DESCONHECIDA';
    const tipoLimpo = lanc.tipo ? String(lanc.tipo).trim().toUpperCase() : 'DESCONHECIDO';
    
    const chave = `${tipoLimpo}__${contaLimpa}`;
    
    if (!regrasAgrupadas[chave]) {
      regrasAgrupadas[chave] = {
        descricao_parcial: tipoLimpo,
        conta: contaLimpa, // Salva a versão limpa
        banco: extrato.banco ? String(extrato.banco).toLowerCase().trim() : 'desconhecido',
        debito: lanc.conta_debito ? String(lanc.conta_debito).trim() : null,
        credito: lanc.conta_credito ? String(lanc.conta_credito).trim() : null,
        quantidade: 0
      };
    }
    regrasAgrupadas[chave].quantidade += 1;
  });

    const regrasLista = Object.values(regrasAgrupadas);
    setRegrasParaSalvar(regrasLista);
    setModalLoteOpen(true);
  };

  /**
   * 🆕 NOVO: Salva todas as regras em lote via API
   */
  const handleSalvarRegrasLote = async () => {
    try {
      const response = await axios.post('http://localhost:8000/api/salvar-regras-lote', {
        regras: regrasParaSalvar,
        criado_por: "usuario_frontend"
      });

      alert(`✅ ${response.data.message}\n\nPróximos extratos desta conta já virão classificados automaticamente!`);
      setModalLoteOpen(false);
      setRegrasParaSalvar([]);
    } catch (error) {
      console.error("❌ Erro ao salvar regras:", error);
      alert(`Erro ao salvar regras: ${error.message}`);
    }
  };

  /**
   * Handler para geração do CSV
   */
  const handleGerarCSV = async () => {
    setLoading(true);
    setProgress(' Gerando CSV...');
    
    try {
      const result = await gerarCSV(extrato);
      
      if (result.success) {
        const downloadUrl = getDownloadURL(result.data.filename);
        setCsvUrl(downloadUrl);
        setProgress('✅ CSV gerado com sucesso!');
        console.log('✅ CSV gerado:', result.data.filename);
        
        setTimeout(() => setProgress(''), 2000);
      } else {
        throw new Error(result.message || 'Erro ao gerar CSV');
      }
    } catch (err) {
      console.error(' Erro ao gerar CSV:', err);
      setError(`❌ Erro ao gerar CSV: ${err.message}`);
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 NOVO: Conta quantos lançamentos foram editados manualmente
  const totalEditados = extrato?.lancamentos.filter(l => l.editado_manualmente).length || 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#333',
        marginBottom: '30px',
        fontSize: '32px'
      }}>
        🏦 Extrator Bancário Inteligente
      </h1>
      
      <FileUpload onFileSelect={handleFileSelect} />

      {loading && (
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '8px',
          border: '1px solid #90caf9',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '16px', color: '#1976d2' }}>
            {progress || '⏳ Processando...'}
          </p>
          <div style={{ 
            marginTop: '10px', 
            height: '4px', 
            backgroundColor: '#bbdefb',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              backgroundColor: '#1976d2',
              width: '100%',
              animation: 'loading 2s ease-in-out infinite'
            }}></div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          backgroundColor: '#ffebee', 
          borderRadius: '8px',
          border: '1px solid #ef9a9a',
          color: '#c62828'
        }}>
          <p style={{ margin: 0, fontSize: '16px' }}>{error}</p>
        </div>
      )}

      {extrato && (
        <>
          <div style={{ 
            marginTop: '20px', 
            padding: '25px', 
            backgroundColor: '#f0f8ff', 
            borderRadius: '8px',
            border: '2px solid #b3d1ff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0, color: '#1976d2', textAlign: 'center' }}>
              📊 Resumo do Extrato
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '15px' 
            }}>
              <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                <strong style={{ color: '#666' }}>Banco:</strong>
                <div style={{ marginTop: '5px', fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                  {extrato.banco}
                </div>
              </div>
              <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                <strong style={{ color: '#666' }}>Agência:</strong>
                <div style={{ marginTop: '5px', fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                  {extrato.agencia}
                </div>
              </div>
              <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                <strong style={{ color: '#666' }}>Conta:</strong>
                <div style={{ marginTop: '5px', fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                  {extrato.conta}
                </div>
              </div>
              <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                <strong style={{ color: '#666' }}>Competência:</strong>
                <div style={{ marginTop: '5px', fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                  {extrato.competencia}
                </div>
              </div>
              <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', gridColumn: 'span 2' }}>
                <strong style={{ color: '#666' }}>Total de lançamentos:</strong>
                <div style={{ marginTop: '5px', fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                  {extrato.lancamentos.length}
                </div>
              </div>
            </div>
          </div>

          <LancamentosTable
            lancamentos={extrato.lancamentos}
            onEditar={handleEditar}
          />

          {/* 🆕 NOVO: Botões de ação no final */}
          <div style={{ 
            marginTop: '30px', 
            textAlign: 'center', 
            paddingBottom: '40px',
            display: 'flex',
            justifyContent: 'center',
            gap: '15px',
            flexWrap: 'wrap'
          }}>
            {/* 🆕 Botão Salvar Regras Aprendidas */}
            <button
              onClick={handleAbrirModalRegras}
              disabled={totalEditados === 0}
              style={{
                padding: '18px 36px',
                fontSize: '18px',
                fontWeight: 'bold',
                backgroundColor: totalEditados === 0 ? '#ccc' : '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: totalEditados === 0 ? 'not-allowed' : 'pointer',
                boxShadow: totalEditados === 0 ? 'none' : '0 4px 12px rgba(255, 152, 0, 0.4)',
                transition: 'all 0.3s',
                opacity: totalEditados === 0 ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseOver={(e) => {
                if (totalEditados > 0) {
                  e.target.style.backgroundColor = '#f57c00';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseOut={(e) => {
                if (totalEditados > 0) {
                  e.target.style.backgroundColor = '#ff9800';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
               Salvar Regras Aprendidas
              {totalEditados > 0 && (
                <span style={{
                  backgroundColor: 'white',
                  color: '#ff9800',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '14px'
                }}>
                  {totalEditados}
                </span>
              )}
            </button>

            {/* Botão Gerar CSV */}
            <button
              onClick={handleGerarCSV}
              disabled={loading}
              style={{
                padding: '18px 36px',
                fontSize: '18px',
                fontWeight: 'bold',
                backgroundColor: loading ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(40, 167, 69, 0.4)',
                transition: 'all 0.3s',
                opacity: loading ? 0.6 : 1
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#218838';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#28a745';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              📥 Gerar CSV para o SaaS
            </button>

            {/* Link de Download */}
            {csvUrl && (
              <a
                href={csvUrl}
                download
                style={{
                  padding: '18px 36px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  backgroundColor: '#007bff',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0, 123, 255, 0.4)',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#0056b3';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#007bff';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                 Baixar Arquivo CSV
              </a>
            )}
          </div>
        </>
      )}

      {/* 🆕 NOVO: Modal de salvamento em lote */}
      <ModalSalvarRegrasLote
        isOpen={modalLoteOpen}
        onClose={() => setModalLoteOpen(false)}
        regras={regrasParaSalvar}
        onConfirmar={handleSalvarRegrasLote}
      />

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

export default App;