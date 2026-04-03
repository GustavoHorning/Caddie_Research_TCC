import { useState } from 'react';
import './Cadastro.css';

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
    if (!dados.email.trim() || !/\S+@\S+\.\S+/.test(dados.email))
      novosErros.email = 'Insira um e-mail válido.';
    if (!dados.telefone.trim())
      novosErros.telefone = 'Insira seu telefone.';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function handleContinuar() {
    if (validarPasso1()) setPasso(2);
  }

  function handleCriarConta() {
    if (senhaValida) {
      alert('Conta criada com sucesso! Bem-vindo à Caddie Research 🎉');
    }
  }

  function formatarTelefone(valor: string) {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  }

  return (
    <div className="cadastro-page">
      {/* Lado esquerdo - Formulário */}
      <div className="cadastro-form-side">
        <div className="cadastro-form-container">

          <div className="cadastro-logo">
            Caddie <span className="cadastro-logo-highlight">Research</span>
          </div>

          <h1 className="cadastro-titulo">Crie sua conta</h1>

          {/* Indicador de progresso */}
          <div className="cadastro-progresso">
            <span className="cadastro-passo-label">Passo {passo} de 2</span>
            <p className="cadastro-passo-titulo">
              {passo === 1 ? 'Dados pessoais' : 'Proteja a sua conta'}
            </p>
            <div className="cadastro-barra">
              <div className={`cadastro-barra-fill passo-${passo}`} />
            </div>
          </div>

          {/* PASSO 1 */}
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

          {/* PASSO 2 */}
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
                className={`cadastro-btn ${!senhaValida ? 'btn-desabilitado' : ''}`}
                onClick={handleCriarConta}
                disabled={!senhaValida}
              >
                Concordar e criar conta
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

      {/* Lado direito - Painel da Caddie */}
     <div className="cadastro-painel-lado">
        <img src="/img/caddie-banner.png" alt="Caddie Research" className="painel-imagem-full" />
      </div>
    </div>
  );
}