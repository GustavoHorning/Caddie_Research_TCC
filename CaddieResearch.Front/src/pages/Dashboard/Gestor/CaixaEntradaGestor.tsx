import { useState, useEffect, useRef } from 'react'
import './CaixaEntradaGestor.css'
import TopBar from '../../../components/TopBar'
import SidebarGestor from '../../../components/SidebarGestor'
import api from '../../../services/api'
import logo from '../../../assets/logo.png'

interface Conversa {
  id: number
  assunto: string
  status: string
  dataAbertura: string
  nomeCliente: string
  emailCliente: string
  totalMensagens: number
  naoLidas: number
}

interface Mensagem {
  id: number
  conteudo: string
  ehGestor: boolean
  dataEnvio: string
}

export default function CaixaEntradaGestor() {
  const [menuMobileAberto, setMenuMobileAberto] = useState(false)
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [conversaSelecionada, setConversaSelecionada] = useState<Conversa | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [resposta, setResposta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const mensagensEndRef = useRef<HTMLDivElement>(null)
  const [modalRec, setModalRec] = useState(false)
  const [recForm, setRecForm] = useState({ ticker: '', nomeAtivo: '', classeAtivo: 'Renda Variável', quantidade: '', precoSugerido: '', descricao: '' })
  const [enviandoRec, setEnviandoRec] = useState(false)

  const headers = { Authorization: `Bearer ${localStorage.getItem('caddie_token')}` }

  const carregarConversas = async () => {
    try {
      const res = await api.get('/api/chat/gestor/todas', { headers })
      setConversas(res.data)
    } catch (err) {
      console.error('Erro ao carregar conversas:', err)
    }
  }

  const carregarMensagens = async (conversaId: number) => {
    try {
      const res = await api.get(`/api/chat/${conversaId}/mensagens`, { headers })
      setMensagens(res.data)
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err)
    }
  }

  const deletarConversa = async (id: number) => {
    try {
      await api.delete(`/api/chat/${id}`, { headers })
      if (conversaSelecionada?.id === id) setConversaSelecionada(null)
      await carregarConversas()
    } catch (err) {
      console.error('Erro ao deletar conversa:', err)
    }
  }

  const encerrarConversa = async () => {
    if (!conversaSelecionada) return
    if (!confirm('Tem certeza que deseja encerrar esta conversa?')) return
    try {
      await api.put(`/api/chat/${conversaSelecionada.id}/encerrar`, {}, { headers })
      setConversaSelecionada({ ...conversaSelecionada, status: 'Fechada' })
      await carregarConversas()
    } catch (err) {
      console.error('Erro ao encerrar conversa:', err)
    }
  }

  const enviarResposta = async () => {
    if (!resposta.trim() || !conversaSelecionada || enviando) return
    setEnviando(true)
    try {
      await api.post(`/api/chat/${conversaSelecionada.id}/mensagem`, { conteudo: resposta }, { headers })
      setResposta('')
      await carregarMensagens(conversaSelecionada.id)
    } catch (err) {
      console.error('Erro ao enviar resposta:', err)
    } finally {
      setEnviando(false)
    }
  }

  // Scroll automático
  useEffect(() => {
    mensagensEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  // Carrega conversas ao abrir
  useEffect(() => {
    carregarConversas()
    const interval = setInterval(carregarConversas, 5000)
    return () => clearInterval(interval)
  }, [])

  // Carrega mensagens ao selecionar conversa
  useEffect(() => {
    if (!conversaSelecionada) return
    carregarMensagens(conversaSelecionada.id)
    const interval = setInterval(() => carregarMensagens(conversaSelecionada.id), 4000)
    return () => clearInterval(interval)
  }, [conversaSelecionada])

  async function enviarRecomendacaoChat() {
    if (!conversaSelecionada || !recForm.ticker || !recForm.quantidade || !recForm.precoSugerido) return
    setEnviandoRec(true)
    try {
      // Busca clienteId via conversa
      const clienteRes = await api.get('/api/recomendacoes/clientes', { headers })
      const clientes: any[] = clienteRes.data
      const cliente = clientes.find((c: any) => c.email === conversaSelecionada.emailCliente)
      if (!cliente) { alert('Cliente não encontrado.'); return }

      await api.post('/api/recomendacoes', {
        clienteId: cliente.id,
        ticker: recForm.ticker,
        nomeAtivo: recForm.nomeAtivo,
        classeAtivo: recForm.classeAtivo,
        quantidade: parseFloat(recForm.quantidade),
        precoSugerido: parseFloat(recForm.precoSugerido),
        descricao: recForm.descricao,
        origem: 'Chat'
      }, { headers })

      // Envia mensagem informando a recomendação no chat
      await api.post(`/api/chat/${conversaSelecionada.id}/mensagem`, {
        conteudo: `👍 Recomendação enviada: ${recForm.ticker} (${recForm.nomeAtivo}) — ${recForm.quantidade} unidades a R$ ${recForm.precoSugerido}${recForm.descricao ? '. Tese: ' + recForm.descricao : ''}. Acesse "Recomendações" no seu portfólio para aceitar ou recusar.`
      }, { headers })

      setModalRec(false)
      setRecForm({ ticker: '', nomeAtivo: '', classeAtivo: 'Renda Variável', quantidade: '', precoSugerido: '', descricao: '' })
      await carregarMensagens(conversaSelecionada.id)
    } catch (e) { console.error(e); alert('Erro ao enviar recomendação.') }
    finally { setEnviandoRec(false) }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const iS: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', color: '#e6edf3', fontSize: '0.9rem', outline: 'none' }

  return (
    <div className="dashboard-layout">
      <SidebarGestor activePath="/gestor/atendimento" isOpen={menuMobileAberto} onClose={() => setMenuMobileAberto(false)} />
      {menuMobileAberto && <div className="sidebar-overlay" onClick={() => setMenuMobileAberto(false)}></div>}
      <TopBar userName="Gestor" onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)} />

      <main className="dashboard-main">
        <div className={`caixa-container ${conversaSelecionada ? 'mostrando-chat' : ''}`}>

          {/* ── LISTA DE CONVERSAS ── */}
          <div className="caixa-lista">
            <div className="caixa-lista-header">
              <h3>Caixa de Entrada</h3>
              <span className="caixa-badge-total">{conversas.length}</span>
            </div>

            {conversas.length === 0 ? (
              <div className="caixa-vazia">
                <span>💬</span>
                <p>Nenhuma conversa ainda</p>
              </div>
            ) : (
              conversas.map(c => (
                <div
                  key={c.id}
                  className={`caixa-item ${conversaSelecionada?.id === c.id ? 'ativo' : ''}`}
                  onClick={() => setConversaSelecionada(c)}
                >
                  <div className="caixa-item-avatar">
                    {c.nomeCliente.charAt(0).toUpperCase()}
                  </div>
                  <div className="caixa-item-info">
                    <div className="caixa-item-nome">{c.nomeCliente}</div>
                    <div className="caixa-item-assunto">{c.assunto}</div>
                    <div className="caixa-item-data">{formatarData(c.dataAbertura)}</div>
                  </div>
                  {c.status === 'Fechada' ? (
                    <button
                      className="caixa-btn-limpar"
                      title="Limpar histórico"
                      onClick={e => { e.stopPropagation(); deletarConversa(c.id); }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                      </svg>
                    </button>
                  ) : c.naoLidas > 0 && (
                    <span className="caixa-badge-nao-lidas">{c.naoLidas}</span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* ── CHAT ── */}
          <div className="caixa-chat">
            {!conversaSelecionada ? (
              <div className="caixa-chat-vazio">
                <img src={logo} alt="Caddie Research" className="caixa-chat-vazio-logo" />
                <p>Selecione uma conversa para responder</p>
              </div>
            ) : (
              <>
                <div className="caixa-chat-header">
                  <button className="caixa-btn-voltar" onClick={() => setConversaSelecionada(null)} title="Voltar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <div className="caixa-chat-avatar">
                    {conversaSelecionada.nomeCliente.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="caixa-chat-nome">{conversaSelecionada.nomeCliente}</span>
                    <span className="caixa-chat-email">{conversaSelecionada.emailCliente}</span>
                  </div>
                  <span className={`caixa-status-tag ${conversaSelecionada.status === 'Aberta' ? 'aberta' : 'fechada'}`}>
                    {conversaSelecionada.status}
                  </span>
                  {conversaSelecionada.status === 'Aberta' && (
                    <button className="caixa-btn-encerrar" onClick={encerrarConversa}>
                      Encerrar conversa
                    </button>
                  )}
                </div>

                <div className="caixa-chat-mensagens">
                  {mensagens.length === 0 && (
                    <div className="caixa-sem-mensagens">Nenhuma mensagem ainda.</div>
                  )}
                  {mensagens.map(msg => (
                    <div key={msg.id} className={msg.ehGestor ? 'caixa-msg-gestor' : 'caixa-msg-cliente'}>
                      {!msg.ehGestor && (
                        <div className="caixa-msg-avatar">
                          {conversaSelecionada.nomeCliente.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className={msg.ehGestor ? 'caixa-msg-texto-gestor' : 'caixa-msg-texto-cliente'}>
                        {msg.conteudo}
                        <span className="caixa-msg-hora">{formatarData(msg.dataEnvio)}</span>
                      </div>
                      {msg.ehGestor && (
                        <div className="caixa-msg-avatar-gestor">
                          <img src={logo} alt="Gestor" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={mensagensEndRef} />
                </div>

                <div className="caixa-chat-input">
                  {conversaSelecionada.status === 'Fechada' ? (
                    <div className="caixa-conversa-encerrada">✓ Conversa encerrada</div>
                  ) : (
                  <input
                    type="text"
                    placeholder="Digite sua resposta..."
                    value={resposta}
                    onChange={e => setResposta(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && enviarResposta()}
                    disabled={enviando}
                  />
                  )}
                  {conversaSelecionada.status !== 'Fechada' && (
                    <button
                      title="Recomendar Ativo"
                      style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', borderRadius: 8, padding: '0 12px', cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }}
                      onClick={() => setModalRec(true)}
                    >👍</button>
                  )}
                  <button onClick={enviarResposta} disabled={!resposta.trim() || enviando || conversaSelecionada.status === 'Fechada'}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </main>

      {/* Modal Recomendar Ativo via Chat */}
      {modalRec && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModalRec(false)}>
          <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 28, width: 460, display: 'flex', flexDirection: 'column', gap: 14 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: 0, color: '#e6edf3', fontSize: '1.05rem' }}>👍 Recomendar Ativo — {conversaSelecionada?.nomeCliente}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Ticker', el: <input style={iS} type="text" placeholder="Ex: PETR4" value={recForm.ticker} onChange={e => setRecForm(p => ({ ...p, ticker: e.target.value.toUpperCase() }))} /> },
                { label: 'Nome do Ativo', el: <input style={iS} type="text" placeholder="Ex: Petrobras S.A." value={recForm.nomeAtivo} onChange={e => setRecForm(p => ({ ...p, nomeAtivo: e.target.value }))} /> },
                { label: 'Classe', el: <select style={iS} value={recForm.classeAtivo} onChange={e => setRecForm(p => ({ ...p, classeAtivo: e.target.value }))}><option>Renda Variável</option><option>Renda Fixa</option><option>Internacional</option><option>Outros</option></select> },
                { label: 'Quantidade', el: <input style={iS} type="number" placeholder="Ex: 100" value={recForm.quantidade} onChange={e => setRecForm(p => ({ ...p, quantidade: e.target.value }))} /> },
                { label: 'Preço Sugerido (R$)', col: '1/-1', el: <input style={iS} type="number" placeholder="Ex: 38.50" value={recForm.precoSugerido} onChange={e => setRecForm(p => ({ ...p, precoSugerido: e.target.value }))} /> },
                { label: 'Tese / Descrição (opcional)', col: '1/-1', el: <input style={iS} type="text" placeholder="Ex: Empresa com dividendos consistentes" value={recForm.descricao} onChange={e => setRecForm(p => ({ ...p, descricao: e.target.value }))} /> },
              ].map(({ label, col, el }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: col }}>
                  <label style={{ fontSize: '0.8rem', color: '#8b949e' }}>{label}</label>
                  {el}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }} onClick={enviarRecomendacaoChat} disabled={enviandoRec}>
                {enviandoRec ? 'Enviando...' : '👍 Enviar Recomendação'}
              </button>
              <button style={{ background: 'rgba(255,255,255,0.07)', color: '#c9d1d9', border: 'none', padding: '9px 16px', borderRadius: 8, cursor: 'pointer' }} onClick={() => setModalRec(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
