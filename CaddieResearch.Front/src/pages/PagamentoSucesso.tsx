import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Pagamento.css'

export default function PagamentoSucesso() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'carregando' | 'sucesso' | 'erro'>('carregando')
  const effectRan = useRef(false)
  
  const plano = searchParams.get('plano')

  useEffect(() => {
    if (effectRan.current) return
    effectRan.current = true

    const verificarPagamento = async () => {
      try {
        const token = localStorage.getItem('caddie_token');
        
        // Tenta perguntar à API 5 vezes se o Webhook já chegou (Polling)
        for (let i = 0; i < 5; i++) {
          const res = await axios.get(`http://localhost:5194/api/pagamento/verificar-status?planoDesejado=${plano}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (res.data.status === 'pago') {
            // WEBHOOK CHEGOU! Salva o novo JWT e atualiza a UI
            localStorage.setItem('caddie_token', res.data.token);
            window.dispatchEvent(new Event('perfilAtualizado')); 
            setStatus('sucesso');
            return;
          }

          // Espera 2.5 segundos antes de tentar de novo
          await new Promise(resolve => setTimeout(resolve, 2500));
        }

        setStatus('erro'); // O webhook demorou demais
      } catch (error) {
        setStatus('erro');
      }
    }

    if (plano) {
      verificarPagamento();
    } else {
      setStatus('erro');
    }
  }, [plano])

  return (
    <div className="pag-page">
      <div className="pag-glow" />
      <div className="pag-card pag-sucesso" style={{ textAlign: 'center', margin: '0 auto' }}>
                 
        {status === 'carregando' && (
          <>
            <h2 className="pag-sucesso-titulo" style={{ marginTop: '20px' }}>Processando...</h2>
            <p className="pag-sucesso-sub">Aguarde enquanto liberamos seu acesso e registramos sua assinatura.</p>
          </>
        )}
                 
        {status === 'sucesso' && (
          <>
            <div className="pag-sucesso-icone">✓</div>
            <h2 className="pag-sucesso-titulo">Pagamento confirmado!</h2>
            <p className="pag-sucesso-sub">
              Sua assinatura <strong>{plano?.toUpperCase()}</strong> foi ativada e salva com sucesso.
            </p>
            <button className="pag-btn" style={{ marginTop: 24 }} onClick={() => navigate('/home')}>
              Acessar minha conta
            </button>
          </>
        )}

        {status === 'erro' && (
          <>
            <div className="pag-sucesso-icone" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)' }}>✕</div>
            <h2 className="pag-sucesso-titulo">Processamento pendente</h2>
            <p className="pag-sucesso-sub">
              A confirmação está demorando um pouco mais que o normal. Fique tranquilo, se você pagou, o sistema será atualizado em instantes.
            </p>
            <button className="pag-btn" style={{ marginTop: 24 }} onClick={() => navigate('/home')}>
              Ir para o Painel
            </button>
          </>
        )}
      </div>
    </div>
  )
}