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
  const [sucesso, setSucesso] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const [form, setForm] = useState({
    nomeCartao: '',
    numeroCartao: '',
    validade: '',
    cvv: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  function formatarCartao(valor: string) {
    return valor.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19)
  }

  function formatarValidade(valor: string) {
    return valor.replace(/\D/g, '').replace(/(\d{2})(\d{0,2})/, '$1/$2').slice(0, 5)
  }

  function validar() {
    const errs: Record<string, string> = {}
    
    if (!form.nomeCartao.trim()) errs.nomeCartao = 'Informe o nome no cartão.'
    if (form.numeroCartao.replace(/\s/g, '').length < 16) errs.numeroCartao = 'Número de cartão inválido.'
    
    if (form.validade.length < 5) {
      errs.validade = 'Validade inválida.'
    } else {
      const [mesStr, anoStr] = form.validade.split('/')
      const mes = parseInt(mesStr, 10)
      const ano = parseInt(anoStr, 10) + 2000 
      
      const dataAtual = new Date()
      const mesAtual = dataAtual.getMonth() + 1
      const anoAtual = dataAtual.getFullYear()

      if (mes < 1 || mes > 12) {
        errs.validade = 'Mês inválido.'
      } else if (ano < anoAtual || (ano === anoAtual && mes < mesAtual)) {
        errs.validade = 'Cartão vencido.'
      }
    }

    if (form.cvv.length < 3) errs.cvv = 'CVV inválido.'
    return errs
  }

  async function handlePagar(e: React.FormEvent) {
    e.preventDefault()

    if (metodoPagamento === 'credito') {
      const errs = validar()
      if (Object.keys(errs).length > 0) { setErrors(errs); return }
    }

    setErrors({})
    setCarregando(true)

    try {
      const token = localStorage.getItem('caddie_token'); 

      const response = await fetch('http://localhost:5194/api/pagamento/processar-mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planoNome: plano?.nome,
          preco: plano?.preco
        })
      });

      if (!response.ok) {
        const errorData = await response.json(); 
        throw new Error(errorData.mensagem || 'Falha no processamento.');
      }

      setSucesso(true)
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
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

  if (sucesso) {
    return (
      <div className="pag-page">
        <div className="pag-glow" />
        <div className="pag-card pag-sucesso">
          <div className="pag-sucesso-icone">✓</div>
          <h2 className="pag-sucesso-titulo">Pagamento confirmado!</h2>
          <p className="pag-sucesso-sub">
            Sua assinatura <strong>{plano.nome}</strong> foi ativada com sucesso.
          </p>
          <div className="pag-sucesso-detalhe">
            <span>Plano</span><span>{plano.icone} {plano.nome}</span>
            <span>Valor</span><span>R$ {plano.preco.toFixed(2).replace('.', ',')}/mês</span>
            <span>Status</span><span className="pag-status-ativo">● Ativo</span>
          </div>
          <button className="pag-btn" style={{ marginTop: 24 }} onClick={() => navigate('/home')}>
            Acessar minha conta
          </button>
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
            <p className="pag-resumo-obs">Cobrado mensalmente. Cancele quando quiser.</p>
          </div>
          <button className="pag-voltar" onClick={() => navigate('/planos')}>
            ← Trocar de plano
          </button>
        </div>

        <div className="pag-form-side">
          <h1 className="pag-titulo">Dados de pagamento</h1>
          <p className="pag-subtitulo">
            {metodoPagamento === 'credito' 
              ? 'Pague com seu cartão de crédito.' 
              : 'Finalize sua assinatura via Pix.'}
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

          <form onSubmit={handlePagar} noValidate>
            
            {metodoPagamento === 'credito' && (
              <>
                <div className="pag-field">
                  <label className="pag-label">Nome no cartão</label>
                  <input
                    type="text"
                    className={`pag-input ${errors.nomeCartao ? 'pag-input-error' : ''}`}
                    placeholder="Como está escrito no cartão"
                    value={form.nomeCartao}
                    onChange={e => { setForm(p => ({ ...p, nomeCartao: e.target.value })); setErrors(p => ({ ...p, nomeCartao: '' })) }}
                  />
                  {errors.nomeCartao && <span className="pag-error">{errors.nomeCartao}</span>}
                </div>

                <div className="pag-field">
                  <label className="pag-label">Número do cartão</label>
                  <input
                    type="text"
                    className={`pag-input ${errors.numeroCartao ? 'pag-input-error' : ''}`}
                    placeholder="0000 0000 0000 0000"
                    value={form.numeroCartao}
                    maxLength={19}
                    onChange={e => { setForm(p => ({ ...p, numeroCartao: formatarCartao(e.target.value) })); setErrors(p => ({ ...p, numeroCartao: '' })) }}
                  />
                  {errors.numeroCartao && <span className="pag-error">{errors.numeroCartao}</span>}
                </div>

                <div className="pag-row">
                  <div className="pag-field">
                    <label className="pag-label">Validade</label>
                    <input
                      type="text"
                      className={`pag-input ${errors.validade ? 'pag-input-error' : ''}`}
                      placeholder="MM/AA"
                      value={form.validade}
                      maxLength={5}
                      onChange={e => { setForm(p => ({ ...p, validade: formatarValidade(e.target.value) })); setErrors(p => ({ ...p, validade: '' })) }}
                    />
                    {errors.validade && <span className="pag-error">{errors.validade}</span>}
                  </div>
                  <div className="pag-field">
                    <label className="pag-label">CVV</label>
                    <input
                      type="text"
                      className={`pag-input ${errors.cvv ? 'pag-input-error' : ''}`}
                      placeholder="123"
                      value={form.cvv}
                      maxLength={4}
                      onChange={e => { setForm(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '') })); setErrors(p => ({ ...p, cvv: '' })) }}
                    />
                    {errors.cvv && <span className="pag-error">{errors.cvv}</span>}
                  </div>
                </div>
              </>
            )}

            {metodoPagamento === 'pix' && (
              <div style={{ textAlign: 'center', padding: '24px 0', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <p style={{ color: '#7a90a8', fontSize: '14px', marginBottom: '20px' }}>Escaneie o QR Code abaixo</p>
                <div style={{ width: '180px', height: '180px', backgroundColor: '#fff', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', boxShadow: '0 0 20px rgba(0,0,0,0.3)' }}>
                  <span style={{ fontSize: '80px' }}>📱</span>
                </div>
                <p style={{ color: '#00e676', marginTop: '20px', fontWeight: '600', fontSize: '15px' }}>⚡ Aprovação instantânea</p>
              </div>
            )}

            <button type="submit" className="pag-btn" disabled={carregando}>
              {carregando ? 'Processando...' : `Confirmar Assinatura - R$ ${plano.preco.toFixed(2).replace('.', ',')}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}