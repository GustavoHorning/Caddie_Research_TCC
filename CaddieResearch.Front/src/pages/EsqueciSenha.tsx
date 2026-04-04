import React from 'react'
import { useState } from 'react'
import './Login.css'

interface Props {
  onVoltar: () => void
}

export default function EsqueciSenha({ onVoltar }: Props) {
  const [etapa, setEtapa] = useState<'email' | 'enviado' | 'nova-senha' | 'sucesso'>('email')
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showNova, setShowNova] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const MOCK_EMAIL = 'usuario@email.com'
  const MOCK_CODIGO = '123456'

  const requisitos = [
    { label: 'No mínimo 8 caracteres', ok: novaSenha.length >= 8 },
    { label: 'Ao menos uma letra maiúscula', ok: /[A-Z]/.test(novaSenha) },
    { label: 'Ao menos uma letra minúscula', ok: /[a-z]/.test(novaSenha) },
    { label: 'Ao menos um número', ok: /[0-9]/.test(novaSenha) },
    { label: 'Ao menos um caractere especial', ok: /[^A-Za-z0-9]/.test(novaSenha) },
  ]

  function handleEnviarEmail(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) errs.email = 'O e-mail é obrigatório.'
    else if (!emailRegex.test(email)) errs.email = 'Digite um e-mail válido.'
    else if (email !== MOCK_EMAIL) errs.email = 'E-mail não encontrado em nossa base.'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setEtapa('enviado')
  }

  function handleVerificarCodigo(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!codigo) errs.codigo = 'Digite o código enviado.'
    else if (codigo !== MOCK_CODIGO) errs.codigo = 'Código inválido. Tente novamente.'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setEtapa('nova-senha')
  }

  function handleNovaSenha(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    const tudoOk = requisitos.every(r => r.ok)
    if (!novaSenha) errs.novaSenha = 'Digite a nova senha.'
    else if (!tudoOk) errs.novaSenha = 'A senha não atende todos os requisitos.'
    if (novaSenha && confirmarSenha !== novaSenha) errs.confirmarSenha = 'As senhas não coincidem.'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setEtapa('sucesso')
  }

  if (etapa === 'email') {
    return (
      <div className="wrapper">
        <div className="card">
          <div className="logo">Caddie <span>Research</span></div>
          <h1 className="title">Recuperar senha</h1>
          <p className="subtitle">Informe seu e-mail e enviaremos um código de verificação.</p>
          <form onSubmit={handleEnviarEmail} noValidate>
            <div className="field">
              <label className="label">E-mail</label>
              <input
                type="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                value={email}
                placeholder="seu@email.com"
                onChange={e => { setEmail(e.target.value); setErrors({}) }}
              />
              {errors.email && <span className="error-msg">{errors.email}</span>}
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>
              Enviar código de verificação
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button className="btn-link" onClick={onVoltar}>← Voltar para o login</button>
          </div>
          <p className="hint"><strong>Teste:</strong> use o e-mail <code>usuario@email.com</code></p>
        </div>
      </div>
    )
  }

  if (etapa === 'enviado') {
    return (
      <div className="wrapper">
        <div className="card">
          <div className="logo">Caddie <span>Research</span></div>
          <div className="icon-circle" style={{ background: '#e8f9fb', color: '#00bcd4' }}>✉</div>
          <h1 className="title" style={{ textAlign: 'center' }}>Verifique seu e-mail</h1>
          <p className="subtitle" style={{ textAlign: 'center' }}>
            Enviamos um código de 6 dígitos para <strong>{email}</strong>
          </p>
          <form onSubmit={handleVerificarCodigo} noValidate>
            <div className="field">
              <label className="label">Código de verificação</label>
              <input
                type="text"
                maxLength={6}
                className={`input input-code ${errors.codigo ? 'input-error' : ''}`}
                value={codigo}
                placeholder="000000"
                onChange={e => { setCodigo(e.target.value.replace(/\D/g, '')); setErrors({}) }}
              />
              {errors.codigo && <span className="error-msg">{errors.codigo}</span>}
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>
              Verificar código
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.85rem', color: '#888' }}>
            Não recebeu?{' '}
            <button className="btn-link" onClick={() => setEtapa('email')}>Reenviar código</button>
          </p>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button className="btn-link" onClick={onVoltar}>← Voltar para o login</button>
          </div>
          <p className="hint"><strong>Teste:</strong> código <code>123456</code></p>
        </div>
      </div>
    )
  }

  if (etapa === 'nova-senha') {
    return (
      <div className="wrapper">
        <div className="card">
          <div className="logo">Caddie <span>Research</span></div>
          <h1 className="title">Nova senha</h1>
          <p className="subtitle">Crie uma senha forte para proteger sua conta.</p>
          <form onSubmit={handleNovaSenha} noValidate>
            <div className="field">
              <label className="label">Nova senha</label>
              <div className="password-wrapper">
                <input
                  type={showNova ? 'text' : 'password'}
                  className={`input ${errors.novaSenha ? 'input-error' : ''}`}
                  value={novaSenha}
                  placeholder="••••••••"
                  onChange={e => { setNovaSenha(e.target.value); setErrors(p => ({ ...p, novaSenha: '' })) }}
                />
                <button type="button" className="eye-btn" onClick={() => setShowNova(v => !v)}>
                  {showNova ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.novaSenha && <span className="error-msg">{errors.novaSenha}</span>}
            </div>

            {novaSenha.length > 0 && (
              <div className="requisitos-box">
                <p className="requisitos-titulo">A senha deve conter:</p>
                {requisitos.map(r => (
                  <div key={r.label} className={`requisito ${r.ok ? 'ok' : ''}`}>
                    <span className="requisito-icon">{r.ok ? '✓' : '○'}</span>
                    {r.label}
                  </div>
                ))}
              </div>
            )}

            <div className="field" style={{ marginTop: 16 }}>
              <label className="label">Confirmar nova senha</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmar ? 'text' : 'password'}
                  className={`input ${errors.confirmarSenha ? 'input-error' : ''}`}
                  value={confirmarSenha}
                  placeholder="••••••••"
                  onChange={e => { setConfirmarSenha(e.target.value); setErrors(p => ({ ...p, confirmarSenha: '' })) }}
                />
                <button type="button" className="eye-btn" onClick={() => setShowConfirmar(v => !v)}>
                  {showConfirmar ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmarSenha && <span className="error-msg">{errors.confirmarSenha}</span>}
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>
              Redefinir senha
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="wrapper">
      <div className="card">
        <div className="logo">Caddie <span>Research</span></div>
        <div className="success-box">
          <div className="success-icon">✓</div>
          <p className="success-title">Senha redefinida!</p>
          <p className="success-sub">Sua senha foi atualizada com sucesso.</p>
          <button className="btn-primary" style={{ marginTop: 24 }} onClick={onVoltar}>
            Ir para o login
          </button>
        </div>
      </div>
    </div>
  )
}
