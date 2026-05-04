import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './Pagamento.css'

interface Plano {
  nome: string
  preco: number
  icone: string
}

export default function Pagamento() {
  const location = useLocation()
  const navigate = useNavigate()
  const plano = location.state?.plano as Plano | undefined

  const [metodoPagamento, setMetodoPagamento] = useState<'credito' | 'pix'>('credito')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handlePagar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)

    try {
      const token = localStorage.getItem('caddie_token');
      let usuarioIdReal = 0;

      if (token) {
        try {
          const payloadBase64Url = token.split('.')[1];
          const base64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
          const decodedJson = decodeURIComponent(window.atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const payload = JSON.parse(decodedJson);
          
          const extractedId = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] 
                           || payload.nameid 
                           || payload.sub 
                           || "0";
                           
          usuarioIdReal = parseInt(extractedId, 10);
        } catch (e) {
          console.error("Falha ao decodificar o token JWT", e);
        }
      }

      if (!usuarioIdReal || isNaN(usuarioIdReal)) {
        throw new Error("Usuário não autenticado ou token inválido. Faça login novamente.");
      }

      const response = await fetch('http://localhost:5194/api/pagamento/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          plano: plano?.nome,
          metodo: metodoPagamento,
          usuarioId: usuarioIdReal 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detalhe || errorData.erro || 'Falha no processamento com o gateway.');
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não foi gerada.');
      }
    } catch (error: any) {
      console.error(error);
      setErro(error.message || 'Erro ao comunicar com o servidor. Verifique sua conexão.');
      setCarregando(false)
    }
  }

  if (!plano) {
    return (
      <div className="pag-page">
        <div className="pag-glow" />
        <div className="pag-card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#7a90a8', marginBottom: 24 }}>Nenhum plano selecionado.</p>
          <button className="pag-btn" onClick={() => navigate('/planos')}>Ver planos</button>
        </div>
      </div>
    )
  }

  return (
    <div className="pag-page">
      <div className="pag-glow" />
      <div className="pag-container">

        <div className="pag-resumo">
          <a href="/planos" className="pag-logo">Caddie<span>Research</span></a>
          <div className="pag-resumo-card">
            <p className="pag-resumo-label">Você está assinando</p>
            <div className="pag-resumo-plano">
              <span className="pag-resumo-icone">{plano.icone}</span>
              <div>
                <p className="pag-resumo-nome">Plano {plano.nome}</p>
                <p className="pag-resumo-preco">
                  R$ {plano.preco.toFixed(2).replace('.', ',')}
                  <span>/mês</span>
                </p>
              </div>
            </div>
            <div className="pag-resumo-linha" />
            <div className="pag-resumo-total">
              <span>Total hoje</span>
              <span>R$ {plano.preco.toFixed(2).replace('.', ',')}</span>
            </div>
            <p className="pag-resumo-obs">Cancele quando quiser.</p>
          </div>
          <button className="pag-voltar" onClick={() => navigate('/gerenciar-plano')}>
            ← Trocar de plano
          </button>
        </div>

        <div className="pag-form-side">
          <h1 className="pag-titulo">Finalizar Assinatura</h1>
          <p className="pag-subtitulo">
            Escolha sua forma de pagamento. O processamento é 100% seguro.
          </p>

          <div className="pag-metodos">
            <button
              className={`pag-metodo-btn ${metodoPagamento === 'credito' ? 'ativo' : ''}`}
              onClick={() => setMetodoPagamento('credito')}
              type="button"
            >
              💳 Crédito
            </button>
            <button
              className={`pag-metodo-btn ${metodoPagamento === 'pix' ? 'ativo' : ''}`}
              onClick={() => setMetodoPagamento('pix')}
              type="button"
            >
              ❖ Pix
            </button>
          </div>

          <form onSubmit={handlePagar}>
            
            {metodoPagamento === 'credito' && (
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px' }}>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '12px' }}>Assinatura Mensal Automática</h3>
                <p style={{ color: '#a0b0c0', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Ao escolher o cartão de crédito, sua assinatura será renovada automaticamente a cada mês. Você não precisa se preocupar em pagar boletos ou fazer transferências todo mês.
                </p>
              </div>
            )}

            {metodoPagamento === 'pix' && (
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px' }}>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '12px' }}>Pagamento Único (1 Mês)</h3>
                <p style={{ color: '#a0b0c0', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Ao escolher o Pix, você garante o acesso ao plano por exatos 30 dias. Esta modalidade <strong>não possui renovação automática</strong>, e você precisará realizar um novo pagamento quando o plano expirar.
                </p>
              </div>
            )}

            {erro && (
              <div className="pag-error" style={{ marginBottom: '16px', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>
                {erro}
              </div>
            )}

            <button type="submit" className="pag-btn" disabled={carregando}>
              {carregando ? 'Redirecionando...' : `Pagar R$ ${plano.preco.toFixed(2).replace('.', ',')} no ambiente seguro`}
            </button>

            <p className="pag-seguranca" style={{ marginTop: '24px' }}>
              🔒 Pagamento processado com segurança via AbacatePay.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}