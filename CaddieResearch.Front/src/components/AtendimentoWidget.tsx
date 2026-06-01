import { useEffect, useRef, useState, useCallback } from 'react'
import './AtendimentoWidget.css'
import logo from '../assets/logo.png'
import api from '../services/api'

interface Props {
  isOpen: boolean
  onClose: () => void
  userName: string
}

interface MensagemItem {
  id: number
  conteudo: string
  ehGestor: boolean
  dataEnvio: string
}

interface ConversaHistorico {
  id: number
  assunto: string
  status: string
  dataAbertura: string
  totalMensagens: number
}

type View = 'menu' | 'chat'

export default function AtendimentoWidget({ isOpen, onClose, userName }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const mensagensEndRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>('menu')
  const [mensagem, setMensagem] = useState('')
  const [showSecondMessage, setShowSecondMessage] = useState(false)
  const [conversaId, setConversaId] = useState<number | null>(null)
  const [mensagens, setMensagens] = useState<MensagemItem[]>([])
  const [enviando, setEnviando] = useState(false)
  const [conversaEncerrada, setConversaEncerrada] = useState(false)
  const [historico, setHistorico] = useState<ConversaHistorico[]>([])

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('caddie_token')}`
  })

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Reseta ao fechar
  useEffect(() => {
    if (!isOpen) {
      setView('menu')
      setShowSecondMessage(false)
      setMensagens([])
      setConversaId(null)
      setConversaEncerrada(false)
    }
  }, [isOpen])

  // Segunda mensagem automática após 10s
  useEffect(() => {
    if (view === 'chat') {
      setShowSecondMessage(false)
      const timer = setTimeout(() => setShowSecondMessage(true), 10000)
      return () => clearTimeout(timer)
    }
  }, [view])

  // Scroll automático para última mensagem
  useEffect(() => {
    mensagensEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  // Busca histórico de conversas
  const buscarHistorico = useCallback(async () => {
    try {
      const res = await api.get('/api/chat/minhas-conversas', { headers: getHeaders() })
      setHistorico(res.data)
    } catch (err) {
      console.error('Erro ao buscar histórico:', err)
    }
  }, [])

  // Abre histórico ao abrir o widget
  useEffect(() => {
    if (isOpen) buscarHistorico()
  }, [isOpen])

  // Abre ou recupera conversa no backend
  const abrirConversa = useCallback(async () => {
    try {
      const res = await api.post('/api/chat/abrir', { assunto: 'Investimentos' }, { headers: getHeaders() })
      setConversaId(res.data.conversaId)
    } catch (err) {
      console.error('Erro ao abrir conversa:', err)
    }
  }, [])

  // Busca mensagens (polling)
  const buscarMensagens = useCallback(async (id: number) => {
    try {
      const [msgRes, statusRes] = await Promise.all([
        api.get(`/api/chat/${id}/mensagens`, { headers: getHeaders() }),
        api.get(`/api/chat/${id}/status`, { headers: getHeaders() })
      ])
      setMensagens(msgRes.data)
      setConversaEncerrada(statusRes.data.status === 'Fechada')
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err)
    }
  }, [])

  // Abre conversa do histórico diretamente
  const abrirConversaHistorico = (id: number, encerrada: boolean) => {
    setConversaId(id)
    setConversaEncerrada(encerrada)
    setView('chat')
  }

  // Abre conversa ao entrar no chat (nova)
  useEffect(() => {
    if (view === 'chat' && !conversaId) abrirConversa()
  }, [view])

  // Polling a cada 4 segundos
  useEffect(() => {
    if (!conversaId) return
    buscarMensagens(conversaId)
    const interval = setInterval(() => buscarMensagens(conversaId), 4000)
    return () => clearInterval(interval)
  }, [conversaId])

  // Envia mensagem
  const enviarMensagem = async () => {
    if (!mensagem.trim() || !conversaId || enviando) return
    setEnviando(true)
    try {
      await api.post(`/api/chat/${conversaId}/mensagem`, { conteudo: mensagem }, { headers: getHeaders() })
      setMensagem('')
      await buscarMensagens(conversaId)
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className={`atendimento-overlay ${isOpen ? 'open' : ''}`}>
      <div className="atendimento-panel" ref={ref}>

        {/* ── HEADER ── */}
        <div className="atendimento-header">
          {view === 'chat' && (
            <button className="atendimento-back" onClick={() => setView('menu')} title="Voltar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <span className="atendimento-title">Atendimento</span>
          <button className="atendimento-close" onClick={onClose}>✕</button>
        </div>

        {/* ── VIEW: MENU ── */}
        {view === 'menu' && (
          <div className="atendimento-body">
            <div className="atendimento-message">
              <div className="atendimento-avatar">
                <img src={logo} alt="Caddie Research" />
              </div>
              <div className="atendimento-bubble">
                <p>Olá <strong>{userName}</strong>, é um prazer te-lo por aqui. Em que posso ajudar hoje?</p>
                <span className="atendimento-time">Caddie Research · agora</span>
              </div>
            </div>

            <div className="atendimento-opcoes">
              <button className="atendimento-opcao" onClick={() => setView('chat')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" />
                </svg>
                Falar sobre Investimentos
              </button>
              <button className="atendimento-opcao">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Falar sobre Minha Conta
              </button>
            </div>
          {/* ── HISTÓRICO ── */}
          {historico.length > 0 && (
            <div className="atendimento-historico">
              <span className="atendimento-historico-titulo">Conversas anteriores</span>
              {historico.map(c => (
                <button
                  key={c.id}
                  className="atendimento-historico-item"
                  onClick={() => abrirConversaHistorico(c.id, c.status === 'Fechada')}
                >
                  <div className="historico-item-info">
                    <span className="historico-item-assunto">{c.assunto}</span>
                    <span className="historico-item-data">
                      {new Date(c.dataAbertura).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <span className={`historico-item-status ${c.status === 'Fechada' ? 'fechada' : 'aberta'}`}>
                    {c.status}
                  </span>
                </button>
              ))}
            </div>
          )}
          </div>
        )}

        {/* ── VIEW: CHAT ── */}
        {view === 'chat' && (
          <>
            <div className="chat-identificacao">
              <div className="chat-logo-avatar">
                <img src={logo} alt="Caddie Research" />
              </div>
              <div>
                <span className="chat-nome">Caddie Research</span>
                <span className="chat-status">
                  <span className="chat-status-dot"></span> Online
                </span>
              </div>
            </div>

            <div className="chat-mensagens">
              {/* Mensagens automáticas de boas-vindas */}
              <div className="chat-bubble-gestor">
                <div className="chat-bubble-avatar">
                  <img src={logo} alt="Caddie Research" />
                </div>
                <div className="chat-bubble-texto">
                  Seja bem vindo ao nosso atendimento! É um prazer ter você por aqui :) Vamos começar?
                </div>
              </div>

              {showSecondMessage && (
                <div className="chat-bubble-gestor">
                  <div className="chat-bubble-avatar">
                    <img src={logo} alt="Caddie Research" />
                  </div>
                  <div className="chat-bubble-texto">
                    Deixe sua dúvida técnica aqui que nossos analistas ou até mesmo nossos gestores terão prazer em lhe responder 💬
                  </div>
                </div>
              )}

              {/* Mensagens reais do banco */}
              {mensagens.map(msg => (
                <div key={msg.id} className={msg.ehGestor ? 'chat-bubble-gestor' : 'chat-bubble-cliente'}>
                  {msg.ehGestor && (
                    <div className="chat-bubble-avatar">
                      <img src={logo} alt="Caddie Research" />
                    </div>
                  )}
                  <div className={msg.ehGestor ? 'chat-bubble-texto' : 'chat-bubble-texto-cliente'}>
                    {msg.ehGestor && <span className="chat-bubble-remetente">Analista Caddie</span>}
                    {msg.conteudo}
                  </div>
                </div>
              ))}

              {conversaEncerrada && (
                <div className="chat-encerrado-banner">
                  <p className="chat-encerrado-titulo">O chat foi encerrado.</p>
                  <button
                    className="chat-novo-chat-btn"
                    onClick={() => {
                      setConversaId(null)
                      setMensagens([])
                      setConversaEncerrada(false)
                      setShowSecondMessage(false)
                      setView('menu')
                    }}
                  >
                    Para iniciar um novo chat, clique aqui.
                  </button>
                </div>
              )}

              <div ref={mensagensEndRef} />
            </div>

            <div className="chat-input-area">
              {conversaEncerrada ? (
                <div className="chat-encerrado">
                  ✓ Conversa encerrada
                </div>
              ) : (
                <>
                  <input
                    className="chat-input"
                    type="text"
                    placeholder="Digite sua mensagem..."
                    value={mensagem}
                    onChange={e => setMensagem(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && enviarMensagem()}
                    disabled={enviando}
                  />
                  <button
                    className="chat-send-btn"
                    onClick={enviarMensagem}
                    disabled={!mensagem.trim() || enviando}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
