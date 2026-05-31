import { useEffect, useRef, useState } from 'react'
import './AtendimentoWidget.css'
import logo from '../assets/logo.png'

interface Props {
  isOpen: boolean
  onClose: () => void
  userName: string
}

type View = 'menu' | 'chat'

export default function AtendimentoWidget({ isOpen, onClose, userName }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>('menu')
  const [mensagem, setMensagem] = useState('')
  const [showSecondMessage, setShowSecondMessage] = useState(false)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Reseta para o menu quando fechar
  useEffect(() => {
    if (!isOpen) {
      setView('menu')
      setShowSecondMessage(false)
    }
  }, [isOpen])

  // Exibe a segunda mensagem com delay de 4s ao entrar no chat
  useEffect(() => {
    if (view === 'chat') {
      setShowSecondMessage(false)
      const timer = setTimeout(() => setShowSecondMessage(true), 10000)
      return () => clearTimeout(timer)
    }
  }, [view])

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
            </div>

            <div className="chat-input-area">
              <input
                className="chat-input"
                type="text"
                placeholder="Digite sua mensagem..."
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && mensagem.trim() && setMensagem('')}
              />
              <button
                className="chat-send-btn"
                onClick={() => mensagem.trim() && setMensagem('')}
                disabled={!mensagem.trim()}
              >
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
  )
}
