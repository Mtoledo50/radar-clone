import { useState } from 'react';

export default function LancamentosTable({ lancamentos, onAprovar, onEditar }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValues, setEditValues] = useState({});

  const handleEditar = (index) => {
    setEditingIndex(index);
    setEditValues({
      conta_debito: lancamentos[index].conta_debito || '',
      conta_credito: lancamentos[index].conta_credito || '',
    });
  };

  const handleSalvar = (index) => {
    onEditar(index, editValues);
    setEditingIndex(null);
  };

  const getStatusIcon = (status) => {
    if (status === 'match') return '✅';
    if (status === 'revisao') return '⚠️';
    return '❓';
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>📋 Lançamentos Extraídos</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Dia</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Descrição</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Débito</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Crédito</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Valor</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {lancamentos.map((lanc, index) => (
            <tr key={index}>
              <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                {getStatusIcon(lanc.status)}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{String(lanc.dia).padStart(2, '0')}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                {lanc.descricao_completa}
                {lanc.similaridade && (
                  <span style={{ fontSize: '12px', color: '#666', marginLeft: '5px' }}>
                    ({lanc.similaridade.toFixed(1)}%)
                  </span>
                )}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                {editingIndex === index ? (
                  <input
                    type="text"
                    value={editValues.conta_debito}
                    onChange={(e) => setEditValues({ ...editValues, conta_debito: e.target.value })}
                    style={{ width: '60px' }}
                  />
                ) : (
                  lanc.conta_debito || '???'
                )}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                {editingIndex === index ? (
                  <input
                    type="text"
                    value={editValues.conta_credito}
                    onChange={(e) => setEditValues({ ...editValues, conta_credito: e.target.value })}
                    style={{ width: '60px' }}
                  />
                ) : (
                  lanc.conta_credito || '???'
                )}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                R$ {lanc.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                {editingIndex === index ? (
                  <button onClick={() => handleSalvar(index)}>Salvar</button>
                ) : (
                  <button onClick={() => handleEditar(index)}>Editar</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}