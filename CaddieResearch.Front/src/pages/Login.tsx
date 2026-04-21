import axios from 'axios'
import React, { useEffect } from 'react'
import { useState } from 'react'
import './Login.css'
import EsqueciSenha from './EsqueciSenha'
import { useGoogleLogin } from '@react-oauth/google'
import { useMsal } from '@azure/msal-react'
import { EventType } from '@azure/msal-browser'

function redirecionarAposLogin() {
  const planoSalvo = sessionStorage.getItem('plano_selecionado')
  if (planoSalvo) {
    sessionStorage.removeItem('plano_selecionado')
    window.location.replace('/pagamento')
  } else {
    window.location.replace('/home')
  }
}

export default function Login() {
  const [tela, setTela] = useState<'login' | 'esqueci'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [carregando, setCarregando] = useState(false)

  const loginGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setCarregando(true)
      try {
        const response = await axios.post('http://localhost:5194/api/auth/login-google', {
          Token: tokenResponse.access_token
        })
        localStorage.setItem('caddie_token', response.data.token)
        redirecionarAposLogin()
      } catch (error: any) {
        console.error(error)
        setErrors({ email: 'Erro ao autenticar com o servidor do Caddie.' })
      } finally {
        setCarregando(false)
      }
    },
    onError: () => {
      setErrors({ email: 'O login com Google foi cancelado ou falhou.' })
    }
  })

  const { instance, accounts, inProgress } = useMsal()

  useEffect(() => {
    if (inProgress === 'none' && accounts.length > 0) {
      setCarregando(true)
      instance.acquireTokenSilent({
        scopes: ['user.read', 'email'],
        account: accounts[0]
      }).then((response) => {
        enviarTokenMicrosoftParaOCSharp(response.accessToken)
      }).catch(error => {
        console.error(error)
        setCarregando(false)
      })
    }
  }, [inProgress, accounts, instance])

  const enviarTokenMicrosoftParaOCSharp = async (token: string) => {
    try {
      const response = await axios.post('http://localhost:5194/api/auth/login-microsoft', {
        Token: token
      })
      localStorage.setItem('caddie_token', response.data.token)
      redirecionarAposLogin()
    } catch (error: any) {
      console.error(error)
      setErrors({ email: 'Erro ao autenticar com o servidor do Caddie.' })
      setCarregando(false)
      instance.logoutRedirect({ account: accounts[0] })
    }
  }

  const loginMicrosoft = () => {
    setCarregando(true)
    instance.loginRedirect({ scopes: ['user.read', 'email'] })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) { setErrors({ email: 'O e-mail é obrigatório.' }); return }
    if (!emailRegex.test(email)) { setErrors({ email: 'Digite um e-mail válido.' }); return }
    if (!password) { setErrors({ password: 'A senha é obrigatória.' }); return }
    setErrors({})
    setCarregando(true)

    try {
      const response = await axios.post('http://localhost:5194/api/auth/login', {
        Email: email,
        Senha: password
      })
      localStorage.setItem('caddie_token', response.data.token)
      redirecionarAposLogin()
    } catch (error: any) {
      console.error(error)
      if (error.response && error.response.data && error.response.data.mensagem) {
        setErrors({ email: error.response.data.mensagem })
      } else {
        setErrors({ email: 'Erro ao conectar com o servidor.' })
      }
    } finally {
      setCarregando(false)
    }
  }

  function handleSocialLogin(provider: string) {
    alert(`Login com ${provider} ainda não implementado.`)
  }

  if (tela === 'esqueci') {
    return <EsqueciSenha onVoltar={() => setTela('login')} />
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

          <button
            type="submit"
            className={`btn-primary ${carregando ? 'btn-loading' : ''}`}
            disabled={carregando}
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="divider"><span>ou acessar com</span></div>

        <div className="social-grid">
          <button type="button" className="social-btn" onClick={() => loginGoogle()} aria-label="Google">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </button>
          <button type="button" className="social-btn" onClick={() => loginMicrosoft()} aria-label="Microsoft">
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
      </div>
    </div>
  )
}