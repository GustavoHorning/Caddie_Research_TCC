import React from 'react'
import { useState } from 'react'
import './Login.css'
import EsqueciSenha from './EsqueciSenha'

const MOCK_USER = { email: 'usuario@email.com', password: 'Senha@123' }

export default function Login() {
  const [tela, setTela] = useState<'login' | 'esqueci'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [success, setSuccess] = useState(false)

  function validate() {
    const newErrors: { email?: string; password?: string } = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) newErrors.email = 'O e-mail é obrigatório.'
    else if (!emailRegex.test(email)) newErrors.email = 'Digite um e-mail válido.'
    else if (email !== MOCK_USER.email) newErrors.email = 'E-mail não encontrado.'
    if (!password) newErrors.password = 'A senha é obrigatória.'
    else if (email === MOCK_USER.email && password !== MOCK_USER.password)
      newErrors.password = 'Senha incorreta. Tente novamente.'
    return newErrors
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSuccess(true)
  }

  function handleSocialLogin(provider: string) {
    alert(`Login com ${provider} ainda não implementado.`)
  }

  if (tela === 'esqueci') {
    return <EsqueciSenha onVoltar={() => setTela('login')} />
  }

  if (success) {
    return (
      <div className="wrapper">
        <div className="card">
          <div className="logo">Caddie <span>Research</span></div>
          <div className="success-box">
            <div className="success-icon">✓</div>
            <p className="success-title">Login realizado com sucesso!</p>
            <p className="success-sub">Bem-vindo de volta.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wrapper">
      <div className="card">
        <div className="logo">Caddie <span>Research</span></div>

        <h1 className="title">Entrar</h1>
        <p className="subtitle">
          Não possui uma conta?{' '}
          <a href="/cadastro" className="link">Cadastre-se agora</a>
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="label">E-mail</label>
            <input
              type="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })) }}
              placeholder="seu@email.com"
            />
            {errors.email && <span className="error-msg">{errors.email}</span>}
          </div>

          <div className="field">
            <label className="label">Senha</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`input ${errors.password ? 'input-error' : ''}`}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })) }}
                placeholder="••••••••"
              />
              <button type="button" className="eye-btn" onClick={() => setShowPassword(v => !v)}>
                {showPassword ? (
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
            {errors.password && <span className="error-msg">{errors.password}</span>}
          </div>

          <div className="forgot-row">
            <button type="button" className="btn-link" onClick={() => setTela('esqueci')}>
              Esqueceu a senha? Recupere aqui
            </button>
          </div>

          <button type="submit" className="btn-primary">Entrar</button>
        </form>

        <div className="divider"><span>ou acessar com</span></div>

        <div className="social-grid">
          <button className="social-btn" onClick={() => handleSocialLogin('Apple')} aria-label="Apple">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
          </button>
          <button className="social-btn" onClick={() => handleSocialLogin('Facebook')} aria-label="Facebook">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </button>
          <button className="social-btn" onClick={() => handleSocialLogin('Google')} aria-label="Google">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </button>
          <button className="social-btn" onClick={() => handleSocialLogin('Microsoft')} aria-label="Microsoft">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#F25022" d="M1 1h10v10H1z" />
              <path fill="#7FBA00" d="M13 1h10v10H13z" />
              <path fill="#00A4EF" d="M1 13h10v10H1z" />
              <path fill="#FFB900" d="M13 13h10v10H13z" />
            </svg>
          </button>
          <button className="social-btn social-btn-wide" onClick={() => handleSocialLogin('SSO Corporativo')}>
            SSO Corporativo
          </button>
        </div>

        <p className="hint">
          <strong>Teste:</strong> email: <code>usuario@email.com</code> / senha: <code>Senha@123</code>
        </p>
      </div>
    </div>
  )
}
