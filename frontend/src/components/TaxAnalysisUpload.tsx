import React, { useState } from 'react';
import axios from 'axios';

const TaxAnalysisUpload: React.FC = () => {
  const [dasFile, setDasFile] = useState<File | null>(null);
  const [simulatorFile, setSimulatorFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    if (!dasFile || !simulatorFile) {
      setError('Por favor, selecione os dois arquivos (DAS e Simulador).');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    // Os nomes 'dasFile' e 'simulatorFile' devem bater com o controller do backend
    formData.append('dasFile', dasFile);
    formData.append('simulatorFile', simulatorFile);

    try {
      const response = await axios.post('/api/tax-analysis/generate', formData, {
        responseType: 'blob', // Essencial para receber o PDF
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Cria o link de download automático
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Analise_Reforma_2027_${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (err) {
      console.error(err);
      setError('Erro ao gerar relatório. Verifique se os PDFs estão legíveis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', maxWidth: '500px' }}>
      <h3>Gerador de Análise Tributária</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>1. PDF do DAS (Real):</label>
        <input type="file" accept=".pdf" onChange={(e) => setDasFile(e.target.files?.[0] || null)} />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>2. PDF do Simulador:</label>
        <input type="file" accept=".pdf" onChange={(e) => setSimulatorFile(e.target.files?.[0] || null)} />
      </div>

      {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

      <button 
        onClick={handleGenerateReport} 
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: loading ? '#ccc' : '#0056b3', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer' 
        }}
      >
        {loading ? 'Processando...' : 'Baixar Relatório Completo'}
      </button>
    </div>
  );
};

export default TaxAnalysisUpload;