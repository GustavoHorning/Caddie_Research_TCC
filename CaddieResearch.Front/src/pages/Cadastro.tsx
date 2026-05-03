import { useState } from 'react';
import './Cadastro.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Passo1 {
  nome: string;
  email: string;
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
        await axios.post('http://localhost:5194/api/auth/cadastrar', {
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

  if (sucesso) {
    return (
      <div className="cadastro-page">
        <div className="cadastro-glow" />
        <div className="cadastro-form-container" style={{ textAlign: 'center' }}>
          <div className="cadastro-logo" style={{ justifyContent: 'center' }}>
            Caddie <span className="cadastro-logo-highlight">Research</span>
          </div>
          
          <div className="success-icon-cadastro">✓</div>
          <h1 className="cadastro-titulo" style={{ fontSize: '24px', marginBottom: '16px', color: '#fff' }}>Conta criada com sucesso!</h1>
          
          <p style={{ color: '#7a90a8', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
            Enviamos um link de confirmação para <strong style={{ color: '#fff' }}>{dados.email}</strong>.<br />
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
    );
  }

  return (
    <div className="cadastro-page">
      <div className="cadastro-glow" />
      
      <div style={{ position: 'absolute', top: '30px', left: '30px', zIndex: 10 }}>
        <button
            onClick={() => navigate('/')}
            className="btn-voltar-site"
        >
            ← Voltar para o Site
        </button>
      </div>

      <div className="cadastro-form-container">
        <div className="cadastro-logo">
          Caddie <span className="cadastro-logo-highlight">Research</span>
        </div>
        
        <h1 className="cadastro-titulo">Crie sua conta</h1>
        
        <div className="cadastro-progresso">
          <div className="cadastro-passo-header">
            <span className="cadastro-passo-label">Passo {passo} de 2</span>
            <p className="cadastro-passo-titulo">
              {passo === 1 ? 'Dados pessoais' : 'Proteja a sua conta'}
            </p>
          </div>
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

              <button className="cadastro-btn" onClick={handleContinuar} style={{ marginTop: '8px' }}>
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
                        {v.ok ? '✓' : '•'}
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

              <p className="cadastro-login-link" style={{ marginTop: '0' }}>
                <button className="btn-voltar-passo" onClick={() => setPasso(1)}>
                    ← Voltar
                </button>
              </p>
            </div>
        )}
      </div>
    </div>
  );
}