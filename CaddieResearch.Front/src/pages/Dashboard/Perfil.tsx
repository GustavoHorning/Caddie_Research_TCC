import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Perfil.css';

export default function Perfil() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [tipoPerfil, setTipoPerfil] = useState('');
  const [status, setStatus] = useState({ tipo: '', msg: '' });

  useEffect(() => {
    const carregarDados = async () => {
      const token = localStorage.getItem('caddie_token');
      const res = await axios.get('http://localhost:5194/api/usuario/meu-perfil', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNome(res.data.nome);
      setEmail(res.data.email);
      setTipoPerfil(res.data.tipoPerfil);
    };
    carregarDados();
  }, []);

  const handleSalvar = async () => {
    try {
      const token = localStorage.getItem('caddie_token');
      await axios.put('http://localhost:5194/api/usuario/atualizar', 
        JSON.stringify(nome), 
        { headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
        }}
      );
      setStatus({ tipo: 'sucesso', msg: 'Alterações salvas com sucesso!' });
      setTimeout(() => setStatus({ tipo: '', msg: '' }), 4000);
    } catch (error) {
      setStatus({ tipo: 'erro', msg: 'Erro ao atualizar dados.' });
    }
  };

  return (
    <div className="perfil-container">
      <h1>Meu Perfil</h1>
      <p className="perfil-subtitulo-page">Gerencie suas informações pessoais e de segurança.</p>

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
          {status.msg && (
            <div className={`perfil-status ${status.tipo}`}>
              {status.tipo === 'sucesso' ? '✓' : '⚠'} {status.msg}
            </div>
          )}
          <button className="perfil-btn" onClick={handleSalvar}>
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}