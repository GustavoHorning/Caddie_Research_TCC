import { useEffect, useRef } from 'react'
import './AtendimentoWidget.css'

interface Props {
  isOpen: boolean
  onClose: () => void
  userName: string
}

export default function AtendimentoWidget({ isOpen, onClose, userName }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  return (
    <div className={`atendimento-overlay ${isOpen ? 'open' : ''}`}>
      <div className="atendimento-panel" ref={ref}>
        <div className="atendimento-header">
          <span className="atendimento-title">Atendimento</span>
          <button className="atendimento-close" onClick={onClose}>✕</button>
        </div>

        <div className="atendimento-body">
          <div className="atendimento-message">
            <div className="atendimento-avatar">C</div>
            <div className="atendimento-bubble">
              <p>Olá <strong>{userName}</strong>, é um prazer te-lo por aqui. Em que posso ajudar hoje?</p>
              <span className="atendimento-time">Caddie Research · agora</span>
            </div>
          </div>

          <div className="atendimento-opcoes">
            <button className="atendimento-opcao">
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
      </div>
    </div>
  )
}