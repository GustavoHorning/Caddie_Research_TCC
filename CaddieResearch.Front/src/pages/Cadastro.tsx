import { useState } from 'react';
import './Cadastro.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Passo1 {
  nome: string;
  email: string;
  telefone: string;
}

interface Passo2 {
  senha: string;
}

export default function Cadastro() {
  const [passo, setPasso] = useState(1);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [emailRejeitado, setEmailRejeitado] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const navigate = useNavigate();

  const [dados, setDados] = useState<Passo1>({
    nome: '',
    email: '',
    telefone: '',
  });

  const [senha, setSenha] = useState<Passo2>({ senha: '' });

  const [erros, setErros] = useState<Partial<Passo1>>({});

  const validacoesSenha = [
    { label: 'No mínimo 8 caracteres', ok: senha.senha.length >= 8 },
    { label: 'Ao menos uma letra maiúscula', ok: /[A-Z]/.test(senha.senha) },
    { label: 'Ao menos uma letra minúscula', ok: /[a-z]/.test(senha.senha) },
    { label: 'Ao menos um número', ok: /[0-9]/.test(senha.senha) },
    { label: 'Ao menos um caractere especial', ok: /[^A-Za-z0-9]/.test(senha.senha) },
  ];

  const senhaValida = validacoesSenha.every((v) => v.ok);

  function validarPasso1() {
    const novosErros: Partial<Passo1> = {};

    if (!dados.nome.trim() || dados.nome.trim().split(' ').length < 2)
      novosErros.nome = 'Insira nome e sobrenome.';

    if (!dados.email.trim() || !/\S+@\S+\.\S+/.test(dados.email)) {
      novosErros.email = 'Insira um e-mail válido.';
    } else if (dados.email === emailRejeitado) {
      novosErros.email = 'Este e-mail já está em uso no Caddie Research.';
    }

    if (!dados.telefone.trim())
      novosErros.telefone = 'Insira seu telefone.';

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function handleContinuar() {
    if (validarPasso1()) setPasso(2);
  }

  async function handleCriarConta() {
    if (senhaValida) {
      setCarregando(true);

      try {
        const response = await axios.post('http://localhost:5194/api/auth/cadastrar', {
          Nome: dados.nome,
          Email: dados.email,
          Senha: senha.senha
        });

        setSucesso(true);

      } catch (error: any) {
        console.error("Erro na API:", error);

        setPasso(1);
        setEmailRejeitado(dados.email);

        if (error.response && error.response.data) {
          if (error.response.data.mensagem) {
            setErros({ email: error.response.data.mensagem });
          }
          else if (error.response.data.errors) {
            const primeiroErro = Object.values(error.response.data.errors)[0] as string[];
            setErros({ email: primeiroErro[0] });
          }
        } else {
          setErros({ email: 'Erro de conexão com o servidor. Tente novamente.' });
        }
      } finally {
        setCarregando(false);
      }
    }
  }

  function formatarTelefone(valor: string) {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  }

  if (sucesso) {
    return (
        <div className="cadastro-page">
          <div className="cadastro-form-side">
            <div className="cadastro-form-container" style={{ textAlign: 'center', marginTop: '10vh' }}>
              <div className="cadastro-logo" style={{ justifyContent: 'center' }}>
                Caddie <span className="cadastro-logo-highlight">Research</span>
              </div>

              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎉</div>
              <h1 className="cadastro-titulo" style={{ fontSize: '28px', marginBottom: '16px' }}>Conta criada com sucesso!</h1>

              <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6', marginBottom: '40px' }}>
                Enviamos um link de confirmação para <strong>{dados.email}</strong>.<br />
                Por favor, verifique sua caixa de entrada (e a pasta de spam) para ativar sua conta.
              </p>

              <button
                  className="cadastro-btn"
                  onClick={() => window.location.replace('/login')}
                  style={{ maxWidth: '300px', margin: '0 auto' }}
              >
                Ir para o Login
              </button>
            </div>
          </div>

          <div className="cadastro-painel-lado">
            <img src="/img/caddie-banner.png" alt="Caddie Research" className="painel-imagem-full" />
          </div>
        </div>
    );
  }
  return (
      <div className="cadastro-page">
        <div style={{ position: 'absolute', top: '30px', left: '30px' }}>
          <button
              onClick={() => navigate('/')}
              style={{ background: 'none', border: 'none', color: '#7a90a8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', padding: '0', transition: 'color 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
              onMouseOut={(e) => e.currentTarget.style.color = '#7a90a8'}
          >
            ← Voltar para o Site
          </button>
        </div>
        <div className="cadastro-form-side">
          <div className="cadastro-form-container">

            <div className="cadastro-logo">
              Caddie <span className="cadastro-logo-highlight">Research</span>
            </div>

            <h1 className="cadastro-titulo">Crie sua conta</h1>

            <div className="cadastro-progresso">
              <span className="cadastro-passo-label">Passo {passo} de 2</span>
              <p className="cadastro-passo-titulo">
                {passo === 1 ? 'Dados pessoais' : 'Proteja a sua conta'}
              </p>
              <div className="cadastro-barra">
                <div className={`cadastro-barra-fill passo-${passo}`} />
              </div>
            </div>

            {passo === 1 && (
                <div className="cadastro-fields">
                  <div className="campo-grupo">
                    <label>Nome completo</label>
                    <input
                        type="text"
                        placeholder="Ex.: João Silva"
                        value={dados.nome}
                        onChange={(e) => setDados({ ...dados, nome: e.target.value })}
                        className={erros.nome ? 'input-erro' : ''}
                    />
                    {erros.nome && <span className="erro-msg">{erros.nome}</span>}
                  </div>

                  <div className="campo-grupo">
                    <label>E-mail</label>
                    <input
                        type="email"
                        placeholder="seu@email.com"
                        value={dados.email}
                        onChange={(e) => setDados({ ...dados, email: e.target.value })}
                        className={erros.email ? 'input-erro' : ''}
                    />
                    {erros.email && <span className="erro-msg">{erros.email}</span>}
                  </div>

                  <div className="campo-grupo">
                    <label>Telefone</label>
                    <input
                        type="tel"
                        placeholder="(00) 00000-0000"
                        value={dados.telefone}
                        onChange={(e) =>
                            setDados({ ...dados, telefone: formatarTelefone(e.target.value) })
                        }
                        className={erros.telefone ? 'input-erro' : ''}
                    />
                    {erros.telefone && <span className="erro-msg">{erros.telefone}</span>}
                  </div>

                  <button className="cadastro-btn" onClick={handleContinuar}>
                    Continuar
                  </button>

                  <p className="cadastro-login-link">
                    Já tenho uma conta <a href="/login">Entrar</a>
                  </p>
                </div>
            )}

            {passo === 2 && (
                <div className="cadastro-fields">
                  <div className="campo-grupo">
                    <label>Senha</label>
                    <div className="senha-wrapper">
                      <input
                          type={mostrarSenha ? 'text' : 'password'}
                          placeholder="Digite sua senha"
                          value={senha.senha}
                          onChange={(e) => setSenha({ senha: e.target.value })}
                      />
                      <button
                          className="senha-toggle"
                          onClick={() => setMostrarSenha(!mostrarSenha)}
                          type="button"
                      >
                        {mostrarSenha ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div className="senha-requisitos">
                    <p className="requisitos-titulo">A senha deve conter:</p>
                    {validacoesSenha.map((v, i) => (
                        <div key={i} className={`requisito ${v.ok ? 'ok' : ''}`}>
                    <span className="requisito-icone">
                      {v.ok && (
                          <svg viewBox="0 0 10 8" width="9" height="9" fill="none">
                            <path
                                d="M1 4l3 3 5-6"
                                stroke="white"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                          </svg>
                      )}
                    </span>
                          {v.label}
                        </div>
                    ))}
                  </div>

                  <p className="cadastro-termos">
                    Ao criar sua conta, você está de acordo com os{' '}
                    <a href="#">termos de uso</a> e{' '}
                    <a href="#">política de privacidade</a> da Caddie Research.
                  </p>

                  <button
                      className={`cadastro-btn ${!senhaValida || carregando ? 'btn-desabilitado' : ''}`}
                      onClick={handleCriarConta}
                      disabled={!senhaValida || carregando}
                  >
                    {carregando ? 'Criando conta...' : 'Concordar e criar conta'}
                  </button>

                  <p className="cadastro-login-link">
                    <button className="btn-voltar" onClick={() => setPasso(1)}>
                      ← Voltar
                    </button>
                  </p>
                </div>
            )}
          </div>
        </div>

        <div className="cadastro-painel-lado">
          <img src="/img/caddie-banner.png" alt="Caddie Research" className="painel-imagem-full" />
        </div>
      </div>
  );
}