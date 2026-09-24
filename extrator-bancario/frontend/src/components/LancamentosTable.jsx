import { useState } from 'react';

/**
 * Componente de Tabela de Lançamentos Bancários
 * ==============================================
 * 
 * 📝 FUNCIONALIDADE:
 *    - Exibe lista de lançamentos extraídos do PDF
 *    - Permite edição inline das contas contábeis (Débito/Crédito)
 *    - Exibe status de classificação (pendente, match, revisão)
 * 
 * 🆕 ALTERAÇÃO SET/2026:
 *    - Coluna "Dia" agora verifica `data_completa` primeiro.
 *    - Se existir (ex: Itaú multimes), mostra "DD/MM/AAAA".
 *    - Se não existir (ex: BB mês único), mostra apenas "DD" como antes.
 *    - Isso resolve o problema de legibilidade em extratos consolidados.
 */

function LancamentosTable({ lancamentos, onEditar }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValues, setEditValues] = useState({
    conta_debito: '',
    conta_credito: '',
  });

  // Handler para iniciar edição
  const handleEditar = (index) => {
    setEditingIndex(index);
    setEditValues({
      conta_debito: lancamentos[index].conta_debito || '',
      conta_credito: lancamentos[index].conta_credito || '',
    });
  };

  // Handler para salvar edição e notificar o pai (App.jsx)
  const handleSalvar = (index) => {
    onEditar(index, editValues);
    setEditingIndex(null);
  };

  // Retorna ícone baseado no status do lançamento
  const getStatusIcon = (status) => {
    if (status === 'match') return '✅';
    if (status === 'revisao') return '⚠️';
    if (status === 'aprovado') return '👍'; // Novo status para edições manuais
    return '❓'; // pendente
  };

  // 🆕 NOVA FUNÇÃO: Formata a data inteligentemente
  const formatarData = (lancamento) => {
    // Prioridade 1: Se o parser enviou data_completa (ex: Itaú "15/07/2026")
    if (lancamento.data_completa) {
      return (
        <span style={{ fontWeight: 'bold', color: '#0d9488', fontSize: '13px' }}>
          {lancamento.data_completa}
        </span>
      );
    }
    
    // Prioridade 2: Fallback para o comportamento antigo (apenas dia)
    // Mantém compatibilidade com BB, Banrisul e Sicredi
    return String(lancamento.dia).padStart(2, '0');
  };

  return (
    <div style={{ marginTop: '20px', overflowX: 'auto' }}>
      <h3 style={{ textAlign: 'center', color: '#333', marginBottom: '15px' }}>
        📋 Lançamentos Extraídos
      </h3>
      
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse', 
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc' }}>
            <th style={{ padding: '12px 10px', borderBottom: '2px solid #e2e8f0', textAlign: 'center', width: '60px' }}>Status</th>
            {/* 🆕 Cabeçalho atualizado para refletir que pode ser Data ou Dia */}
            <th style={{ padding: '12px 10px', borderBottom: '2px solid #e2e8f0', textAlign: 'center', width: '100px' }}>Data / Dia</th>
            <th style={{ padding: '12px 10px', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Descrição</th>
            <th style={{ padding: '12px 10px', borderBottom: '2px solid #e2e8f0', textAlign: 'center', width: '100px' }}>Débito</th>
            <th style={{ padding: '12px 10px', borderBottom: '2px solid #e2e8f0', textAlign: 'center', width: '100px' }}>Crédito</th>
            <th style={{ padding: '12px 10px', borderBottom: '2px solid #e2e8f0', textAlign: 'right', width: '120px' }}>Valor</th>
            <th style={{ padding: '12px 10px', borderBottom: '2px solid #e2e8f0', textAlign: 'center', width: '80px' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {lancamentos.map((lanc, index) => (
            <tr 
              key={index} 
              style={{ 
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8fafc'}
            >
              {/* Coluna Status */}
              <td style={{ padding: '10px', textAlign: 'center', fontSize: '18px' }}>
                {getStatusIcon(lanc.status)}
              </td>
              
              {/* 🆕 Coluna Data/Dia - Usa a função inteligente formatarData */}
              <td style={{ padding: '10px', textAlign: 'center' }}>
                {formatarData(lanc)}
              </td>
              
              {/* Coluna Descrição */}
              <td style={{ padding: '10px', fontSize: '14px' }}>
                <div style={{ fontWeight: '500', color: '#1e293b' }}>
                  {lanc.descricao_completa || lanc.descricao || lanc.tipo}
                </div>
                {lanc.similaridade && (
                  <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '5px' }}>
                    ({lanc.similaridade.toFixed(1)}% match)
                  </span>
                )}
              </td>
              
              {/* Coluna Débito (Editável) */}
              <td style={{ padding: '10px', textAlign: 'center' }}>
                {editingIndex === index ? (
                  <input
                    type="text"
                    value={editValues.conta_debito}
                    onChange={(e) => setEditValues({ ...editValues, conta_debito: e.target.value })}
                    style={{ 
                      width: '70px', 
                      padding: '4px', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}
                    autoFocus
                  />
                ) : (
                  <span style={{ color: lanc.conta_debito ? '#0f172a' : '#94a3b8' }}>
                    {lanc.conta_debito || '???'}
                  </span>
                )}
              </td>
              
              {/* Coluna Crédito (Editável) */}
              <td style={{ padding: '10px', textAlign: 'center' }}>
                {editingIndex === index ? (
                  <input
                    type="text"
                    value={editValues.conta_credito}
                    onChange={(e) => setEditValues({ ...editValues, conta_credito: e.target.value })}
                    style={{ 
                      width: '70px', 
                      padding: '4px', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}
                  />
                ) : (
                  <span style={{ color: lanc.conta_credito ? '#0f172a' : '#94a3b8' }}>
                    {lanc.conta_credito || '???'}
                  </span>
                )}
              </td>
              
              {/* Coluna Valor */}
              <td style={{ 
                padding: '10px', 
                textAlign: 'right', 
                fontWeight: 'bold',
                color: lanc.sinal === '-' ? '#dc2626' : '#16a34a',
                fontFamily: 'monospace'
              }}>
                R$ {lanc.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              
              {/* Coluna Ações */}
              <td style={{ padding: '10px', textAlign: 'center' }}>
                {editingIndex === index ? (
                  <button 
                    onClick={() => handleSalvar(index)}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: '#16a34a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    💾 Salvar
                  </button>
                ) : (
                  <button 
                    onClick={() => handleEditar(index)}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✏️ Editar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {lancamentos.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#64748b',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          Nenhum lançamento encontrado neste extrato.
        </div>
      )}
    </div>
  );
}

export default LancamentosTable;