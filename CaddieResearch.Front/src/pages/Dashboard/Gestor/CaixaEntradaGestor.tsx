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

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="dashboard-layout">
      <SidebarGestor activePath="/gestor/atendimento" isOpen={menuMobileAberto} onClose={() => setMenuMobileAberto(false)} />
      {menuMobileAberto && <div className="sidebar-overlay" onClick={() => setMenuMobileAberto(false)}></div>}
      <TopBar userName="Gestor" onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)} />

      <main className="dashboard-main">
        <div className="caixa-container">

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
                  {c.naoLidas > 0 && (
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
                  <input
                    type="text"
                    placeholder="Digite sua resposta..."
                    value={resposta}
                    onChange={e => setResposta(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && enviarResposta()}
                    disabled={enviando}
                  />
                  <button onClick={enviarResposta} disabled={!resposta.trim() || enviando}>
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
    </div>
  )
}
