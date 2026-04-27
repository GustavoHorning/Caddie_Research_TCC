import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Perfil.css';

export default function Perfil() {
  // Estados do Perfil
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [tipoPerfil, setTipoPerfil] = useState('');
  const [statusPerfil, setStatusPerfil] = useState({ tipo: '', msg: '' });

  // Estados da Senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [statusSenha, setStatusSenha] = useState({ tipo: '', msg: '' });

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const token = localStorage.getItem('caddie_token');
        const res = await axios.get('http://localhost:5194/api/usuario/meu-perfil', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNome(res.data.nome);
        setEmail(res.data.email);
        setTipoPerfil(res.data.tipoPerfil);
      } catch (error) {
        console.error("Erro ao carregar dados", error);
      }
    };
    carregarDados();
  }, []);

  const handleSalvarPerfil = async () => {
    try {
      const token = localStorage.getItem('caddie_token');
      await axios.put('http://localhost:5194/api/usuario/atualizar', 
        JSON.stringify(nome), 
        { headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
        }}
      );
      setStatusPerfil({ tipo: 'sucesso', msg: 'Alterações salvas com sucesso!' });
      setTimeout(() => setStatusPerfil({ tipo: '', msg: '' }), 4000);
    } catch (error) {
      setStatusPerfil({ tipo: 'erro', msg: 'Erro ao atualizar dados.' });
    }
  };

  const handleAlterarSenha = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setStatusSenha({ tipo: 'erro', msg: 'Preencha todos os campos.' });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setStatusSenha({ tipo: 'erro', msg: 'A nova senha e a confirmação não coincidem.' });
      return;
    }

    try {
      const token = localStorage.getItem('caddie_token');
      await axios.put('http://localhost:5194/api/usuario/alterar-senha', 
        { SenhaAtual: senhaAtual, NovaSenha: novaSenha },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setStatusSenha({ tipo: 'sucesso', msg: 'Senha alterada com sucesso!' });
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setTimeout(() => setStatusSenha({ tipo: '', msg: '' }), 5000);
      
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.mensagem) {
        setStatusSenha({ tipo: 'erro', msg: error.response.data.mensagem });
      } else {
        setStatusSenha({ tipo: 'erro', msg: 'Erro de conexão. Tente novamente.' });
      }
    }
  };

  return (
    <div className="perfil-container">
      <h1>Meu Perfil</h1>
      <p className="perfil-subtitulo-page">Gerencie suas informações pessoais e de segurança.</p>

      {/* CARD DE INFORMAÇÕES PESSOAIS */}
      <div className="perfil-card">
        <div className="perfil-header-info">
          <div className="perfil-avatar-grande">
            {nome.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="perfil-header-text">
            <h2>{nome}</h2>
            <p>Plano atual: <strong style={{color: '#00B4D8'}}>{tipoPerfil}</strong></p>
          </div>
        </div>

        <div className="perfil-grid">
          <div className="perfil-field">
            <label>E-mail</label>
            <input type="text" value={email} disabled />
          </div>
          
          <div className="perfil-field">
            <label>Nível de Acesso</label>
            <input type="text" value={tipoPerfil} disabled />
          </div>

          <div className="perfil-field full-width">
            <label>Nome Completo</label>
            <input 
              type="text" 
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
              placeholder="Digite seu nome"
            />
          </div>
        </div>

        <div className="perfil-footer">
          {statusPerfil.msg && (
            <div className={`perfil-status ${statusPerfil.tipo}`}>
              {statusPerfil.tipo === 'sucesso' ? '✓' : '⚠'} {statusPerfil.msg}
            </div>
          )}
          <button className="perfil-btn" onClick={handleSalvarPerfil}>
            Salvar Alterações
          </button>
        </div>
      </div>

      {/* CARD DE SEGURANÇA E SENHA */}
      <div className="perfil-card" style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#fff', fontSize: '20px', marginBottom: '8px' }}>Segurança</h2>
        <p className="perfil-subtitulo-page" style={{ marginBottom: '24px' }}>Altere a sua senha de acesso.</p>

        <div className="perfil-grid">
          <div className="perfil-field full-width">
            <label>Senha Atual</label>
            <input 
              type="password" 
              value={senhaAtual} 
              onChange={e => setSenhaAtual(e.target.value)} 
              placeholder="••••••••" 
            />
          </div>
          <div className="perfil-field">
            <label>Nova Senha</label>
            <input 
              type="password" 
              value={novaSenha} 
              onChange={e => setNovaSenha(e.target.value)} 
              placeholder="••••••••" 
            />
          </div>
          <div className="perfil-field">
            <label>Confirmar Nova Senha</label>
            <input 
              type="password" 
              value={confirmarSenha} 
              onChange={e => setConfirmarSenha(e.target.value)} 
              placeholder="••••••••" 
            />
          </div>
        </div>

        <div className="perfil-footer">
          {statusSenha.msg && (
            <div className={`perfil-status ${statusSenha.tipo}`}>
              {statusSenha.tipo === 'sucesso' ? '✓' : '⚠'} {statusSenha.msg}
            </div>
          )}
          <button className="perfil-btn" onClick={handleAlterarSenha} style={{ background: 'transparent', border: '1px solid #00B4D8', color: '#00B4D8' }}>
            Atualizar Senha
          </button>
        </div>
      </div>

    </div>
  );
}