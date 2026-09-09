import { useState } from 'react';
import axios from 'axios';

/**
 * ModalSalvarRegra — Componente para salvar regras aprendidas por conta.
 * 
 * PRINCÍPIOS DO PROMPT ESPECIALIZADO:
 * ✅ Human-in-the-Loop: Sistema sugere → Humano confirma
 * ✅ LGPD: NUNCA mostra nome completo, apenas o tipo do lançamento
 * ✅ Fórmulas Configuráveis: Regras salvas em JSON editável
 * ✅ Conta Específica: Cada conta tem suas próprias regras
 */
export default function ModalSalvarRegra({ 
  isOpen, 
  onClose, 
  lancamento, 
  conta, 
  banco 
}) {
  const [saving, setSaving] = useState(false);

  // Se modal não estiver aberto ou sem dados, não renderiza
  if (!isOpen || !lancamento) return null;

  /**
   * Salva a regra aprendida via API
   * 
   * ⚠️  LGPD: Enviamos apenas o TIPO (ex: "PIX ENVIADO"), 
   * NUNCA o nome completo da pessoa!
   */
  const handleSalvar = async () => {
    setSaving(true);
    
    try {
      const response = await axios.post(
        'http://localhost:8000/api/salvar-regra',
        {
          conta: conta,                    // ex: "06.254434.0-9"
          banco: banco,                    // ex: "banrisul"
          descricao_parcial: lancamento.tipo,  // ⚠️ APENAS O TIPO! Ex: "PIX ENVIADO"
          debito: lancamento.conta_debito,
          credito: lancamento.conta_credito,
          criado_por: "usuario_frontend"
        }
      );

      // Feedback visual de sucesso
      alert(`✅ ${response.data.message}\n\nPróximos extratos desta conta já virão classificados automaticamente!`);
      onClose();
    } catch (error) {
      console.error("❌ Erro ao salvar regra:", error);
      alert(`Erro ao salvar regra: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(2px)'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '35px',
        borderRadius: '12px',
        maxWidth: '550px',
        width: '90%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        animation: 'slideIn 0.3s ease-out'
      }}>
        {/* Cabeçalho */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '25px',
          paddingBottom: '15px',
          borderBottom: '2px solid #e0e0e0'
        }}>
          <span style={{ fontSize: '32px', marginRight: '12px' }}>💡</span>
          <h3 style={{ margin: 0, color: '#1976d2', fontSize: '24px' }}>
            Nova regra aprendida!
          </h3>
        </div>
        
        {/* Informações da Regra */}
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#555' }}>📝 Tipo de Lançamento:</strong>
            <div style={{ 
              marginTop: '5px', 
              padding: '8px 12px', 
              backgroundColor: '#e3f2fd',
              borderRadius: '4px',
              color: '#1976d2',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              {lancamento.tipo}
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#555' }}> Conta:</strong>
            <div style={{ marginTop: '5px', color: '#333', fontSize: '16px' }}>
              {conta}
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#555' }}>🏛️ Banco:</strong>
            <div style={{ marginTop: '5px', color: '#333', fontSize: '16px', textTransform: 'uppercase' }}>
              {banco}
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '15px',
            marginTop: '15px',
            paddingTop: '15px',
            borderTop: '1px dashed #ccc'
          }}>
            <div>
              <strong style={{ color: '#555' }}>⬅️ Débito:</strong>
              <div style={{ 
                marginTop: '5px', 
                padding: '6px', 
                backgroundColor: lancamento.conta_debito ? '#ffebee' : '#f5f5f5',
                borderRadius: '4px',
                color: lancamento.conta_debito ? '#c62828' : '#999',
                fontWeight: 'bold'
              }}>
                {lancamento.conta_debito || 'N/A'}
              </div>
            </div>
            <div>
              <strong style={{ color: '#555' }}>➡️ Crédito:</strong>
              <div style={{ 
                marginTop: '5px', 
                padding: '6px', 
                backgroundColor: lancamento.conta_credito ? '#e8f5e9' : '#f5f5f5',
                borderRadius: '4px',
                color: lancamento.conta_credito ? '#2e7d32' : '#999',
                fontWeight: 'bold'
              }}>
                {lancamento.conta_credito || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Alerta LGPD */}
        <div style={{ 
          backgroundColor: '#fff3cd', 
          padding: '12px', 
          borderRadius: '6px',
          marginBottom: '25px',
          border: '1px solid #ffc107',
          fontSize: '13px',
          color: '#856404'
        }}>
          <strong>️  Conformidade LGPD:</strong> Esta regra usará apenas o tipo 
          "<strong>{lancamento.tipo}</strong>" para matching, sem armazenar nomes 
          completos de pessoas.
        </div>

        {/* Benefício */}
        <p style={{ 
          color: '#555', 
          fontSize: '15px', 
          lineHeight: '1.6',
          marginBottom: '25px',
          padding: '15px',
          backgroundColor: '#e8f5e9',
          borderRadius: '6px',
          border: '1px solid #c8e6c9'
        }}>
          ✅ <strong>Benefício:</strong> Ao salvar, todos os lançamentos futuros 
          da conta <strong>{conta}</strong> que contenham 
          "<strong>{lancamento.tipo}</strong>" na descrição serão classificados 
          automaticamente!
        </p>

        {/* Botões de Ação */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px',
          marginTop: '20px'
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '500',
              transition: 'background-color 0.3s',
              opacity: saving ? 0.6 : 1
            }}
            onMouseOver={(e) => {
              if (!saving) e.target.style.backgroundColor = '#5a6268';
            }}
            onMouseOut={(e) => {
              if (!saving) e.target.style.backgroundColor = '#6c757d';
            }}
          >
             Não, só desta vez
          </button>
          <button
            onClick={handleSalvar}
            disabled={saving}
            style={{
              padding: '12px 24px',
              backgroundColor: saving ? '#999' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: 'bold',
              transition: 'background-color 0.3s',
              opacity: saving ? 0.6 : 1,
              boxShadow: saving ? 'none' : '0 4px 6px rgba(40, 167, 69, 0.3)'
            }}
            onMouseOver={(e) => {
              if (!saving) e.target.style.backgroundColor = '#218838';
            }}
            onMouseOut={(e) => {
              if (!saving) e.target.style.backgroundColor = '#28a745';
            }}
          >
            {saving ? '⏳ Salvando...' : '✅ Salvar regra permanentemente'}
          </button>
        </div>
      </div>

      {/* Animação CSS inline */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}