import React from 'react'
import { useState } from 'react'
import axios from 'axios'
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
  const [carregando, setCarregando] = useState(false) 

  const requisitos = [
    { label: 'No mínimo 8 caracteres', ok: novaSenha.length >= 8 },
    { label: 'Ao menos uma letra maiúscula', ok: /[A-Z]/.test(novaSenha) },
    { label: 'Ao menos uma letra minúscula', ok: /[a-z]/.test(novaSenha) },
    { label: 'Ao menos um número', ok: /[0-9]/.test(novaSenha) },
    { label: 'Ao menos um caractere especial', ok: /[^A-Za-z0-9]/.test(novaSenha) },
  ]

  async function handleEnviarEmail(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email) errs.email = 'O e-mail é obrigatório.'
    else if (!emailRegex.test(email)) errs.email = 'Digite um e-mail válido.'

    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setCarregando(true)

    try {
      await axios.post('http://localhost:5194/api/auth/esqueci-senha', { Email: email });
      setEtapa('enviado'); 
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.mensagem) {
        setErrors({ email: error.response.data.mensagem });
      } else {
        setErrors({ email: 'Erro de conexão. Tente novamente.' });
      }
    } finally {
      setCarregando(false)
    }
  }

  function handleVerificarCodigo(e: React.FormEvent) {
    e.preventDefault()
    if (!codigo || codigo.length < 6) {
      setErrors({ codigo: 'Digite os 6 dígitos do código.' });
      return;
    }
    setErrors({})
    setEtapa('nova-senha')
  }

  async function handleNovaSenha(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    const tudoOk = requisitos.every(r => r.ok)

    if (!novaSenha) errs.novaSenha = 'Digite a nova senha.'
    else if (!tudoOk) errs.novaSenha = 'A senha não atende todos os requisitos.'

    if (novaSenha && confirmarSenha !== novaSenha) errs.confirmarSenha = 'As senhas não coincidem.'

    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setCarregando(true)

    try {
      await axios.post('http://localhost:5194/api/auth/redefinir-senha', {
        Email: email,
        Token: codigo, 
        NovaSenha: novaSenha
      });
      setEtapa('sucesso');
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.mensagem) {
        setErrors({ novaSenha: error.response.data.mensagem });
        if (error.response.data.mensagem.toLowerCase().includes('código')) {
          setEtapa('enviado');
          setErrors({ codigo: error.response.data.mensagem });
        }
      } else {
        setErrors({ novaSenha: 'Erro ao redefinir a senha.' });
      }
    } finally {
      setCarregando(false)
    }
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
              <button type="submit" className="btn-primary" disabled={carregando} style={{ marginTop: 8 }}>
                {carregando ? 'Enviando...' : 'Enviar código de verificação'}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button type="button" className="btn-link" onClick={onVoltar} disabled={carregando}>← Voltar para o login</button>
            </div>
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
              <button type="button" className="btn-link" onClick={() => setEtapa('email')}>Reenviar código</button>
            </p>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button type="button" className="btn-link" onClick={onVoltar}>← Voltar para o login</button>
            </div>
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
                    {showNova ? '🙈' : '👁️'}
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
                    {showConfirmar ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.confirmarSenha && <span className="error-msg">{errors.confirmarSenha}</span>}
              </div>

              <button type="submit" className="btn-primary" disabled={carregando} style={{ marginTop: 8 }}>
                {carregando ? 'Redefinindo...' : 'Redefinir senha'}
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