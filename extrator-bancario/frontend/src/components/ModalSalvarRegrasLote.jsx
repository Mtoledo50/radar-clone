import { useState, useEffect } from 'react';

export default function ModalSalvarRegrasLote({ 
  isOpen, 
  onClose, 
  regras, 
  onConfirmar 
}) {
  const [saving, setSaving] = useState(false);
  const [regrasValidas, setRegrasValidas] = useState([]);

  useEffect(() => {
    if (isOpen && regras && Array.isArray(regras)) {
      const filtradas = regras.filter(r => 
        r && r.descricao_parcial && r.conta && r.banco
      );
      setRegrasValidas(filtradas);
      console.log('📦 Modal aberto com regras:', filtradas);
    } else {
      setRegrasValidas([]);
    }
  }, [isOpen, regras]);

  // Se modal não estiver aberto, não renderiza nada
  if (!isOpen) return null;

  const handleConfirmar = async () => {
    console.log('💾 Confirmando salvamento de regras:', regrasValidas);
    setSaving(true);
    try {
      await onConfirmar(regrasValidas);
      console.log('✅ Regras salvas com sucesso!');
      onClose();
    } catch (error) {
      console.error('❌ Erro ao salvar regras:', error);
      alert(`Erro ao salvar regras: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Se não há regras válidas, mostra mensagem
  if (regrasValidas.length === 0) {
    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: '#fff',
          padding: '30px',
          borderRadius: '8px',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#ff9800', marginBottom: '15px' }}>️ Nenhuma regra válida</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>Não há regras para salvar.</p>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#1976d2' }}>
            💾 Salvar Regras Aprendidas
          </h3>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
            {regrasValidas.length} regra(s) para a conta {regrasValidas[0]?.conta}
          </p>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <strong style={{ fontSize: '14px', color: '#333' }}>📋 Regras que serão salvas:</strong>
          
          <div style={{ marginTop: '10px' }}>
            {regrasValidas.map((regra, index) => (
              <div 
                key={`regra-${index}`}
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ 
                    display: 'inline-block',
                    padding: '4px 10px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '4px',
                    color: '#1976d2',
                    fontWeight: 'bold',
                    fontSize: '13px'
                  }}>
                    {regra.descricao_parcial}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                    Conta: {regra.conta} | Banco: {regra.banco}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#666' }}>Débito</div>
                    <div style={{ 
                      padding: '3px 8px',
                      backgroundColor: regra.debito ? '#ffebee' : '#f0f0f0',
                      borderRadius: '4px',
                      color: regra.debito ? '#c62828' : '#999',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      minWidth: '40px',
                      textAlign: 'center'
                    }}>
                      {regra.debito || '—'}
                    </div>
                  </div>
                  <div style={{ fontSize: '18px', color: '#999' }}>→</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#666' }}>Crédito</div>
                    <div style={{ 
                      padding: '3px 8px',
                      backgroundColor: regra.credito ? '#e8f5e9' : '#f0f0f0',
                      borderRadius: '4px',
                      color: regra.credito ? '#2e7d32' : '#999',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      minWidth: '40px',
                      textAlign: 'center'
                    }}>
                      {regra.credito || '—'}
                    </div>
                  </div>
                  {regra.quantidade && (
                    <div style={{ 
                      marginLeft: '10px',
                      padding: '3px 8px',
                      backgroundColor: '#fff3cd',
                      borderRadius: '10px',
                      fontSize: '11px',
                      color: '#856404',
                      fontWeight: 'bold'
                    }}>
                      {regra.quantidade}x
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ 
          backgroundColor: '#fff3cd', 
          padding: '10px', 
          borderRadius: '6px',
          marginBottom: '20px',
          fontSize: '12px',
          color: '#856404'
        }}>
          <strong>🔐 LGPD:</strong> Apenas tipos de lançamento serão armazenados, sem nomes completos.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            ❌ Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={saving}
            style={{
              padding: '10px 20px',
              backgroundColor: saving ? '#999' : '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {saving ? ' Salvando...' : `💾 Salvar ${regrasValidas.length} regra(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}