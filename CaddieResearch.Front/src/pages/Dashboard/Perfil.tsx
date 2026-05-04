import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Perfil.css';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useNavigate } from 'react-router-dom';
import SidebarGestor from './SidebarGestor';

export default function Perfil() {
  const [mostrarModalExcluirConta, setMostrarModalExcluirConta] = useState(false);
  const [isExcluindoConta, setIsExcluindoConta] = useState(false);
  
  const navigate = useNavigate();
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [tipoPerfil, setTipoPerfil] = useState('');
  const [ehSocial, setEhSocial] = useState(false); 
  const [vencimentoPlano, setVencimentoPlano] = useState<string | null>(null);
  const [statusPerfil, setStatusPerfil] = useState({ tipo: '', msg: '' });

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [statusSenha, setStatusSenha] = useState({ tipo: '', msg: '' });

  const [fotoPerfilUrl, setFotoPerfilUrl] = useState<string | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [mostrarModalRemover, setMostrarModalRemover] = useState(false);

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
        setEhSocial(res.data.ehSocial || false);
        setFotoPerfilUrl(res.data.fotoPerfilUrl || null);
        
        // Pega a data de vencimento que a API enviou
        setVencimentoPlano(res.data.dataVencimento || null);
      } catch (error) {
        console.error("Erro ao carregar dados", error);
      }
    };
    carregarDados();
  }, []);

  const handleExcluirConta = async () => {
    setIsExcluindoConta(true);
    try {
      const token = localStorage.getItem('caddie_token');
      await axios.delete('http://localhost:5194/api/usuario/excluir-conta', {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.removeItem('caddie_token');
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      alert("Erro ao excluir conta. Tente novamente.");
      setIsExcluindoConta(false);
      setMostrarModalExcluirConta(false);
    }
  };

  const handleFotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setFotoPreview(previewUrl);

    const formData = new FormData();
    formData.append('foto', file);

    setIsUploading(true);
    setStatusPerfil({ tipo: '', msg: '' });

    try {
      const token = localStorage.getItem('caddie_token');
      const res = await axios.post('http://localhost:5194/api/usuario/upload-foto', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' 
        }
      });

      setStatusPerfil({ tipo: 'sucesso', msg: 'Foto atualizada com sucesso!' });
      setFotoPerfilUrl(res.data.url);
      window.dispatchEvent(new Event('perfilAtualizado'));
      setTimeout(() => setStatusPerfil({ tipo: '', msg: '' }), 4000);
    } catch (error) {
      setStatusPerfil({ tipo: 'erro', msg: 'Erro ao enviar a foto.' });
      setFotoPreview(null); 
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoverFoto = async () => {
    setIsUploading(true);
    setMostrarModalRemover(false); 

    try {
      const token = localStorage.getItem('caddie_token');
      await axios.delete('http://localhost:5194/api/usuario/remover-foto', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFotoPerfilUrl(null);
      setFotoPreview(null);
      setStatusPerfil({ tipo: 'sucesso', msg: 'Foto removida com sucesso!' });

      window.dispatchEvent(new Event('perfilAtualizado'));
    } catch (error) {
      setStatusPerfil({ tipo: 'erro', msg: 'Erro ao remover a foto.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSalvarPerfil = async () => {
    if (!nome || nome.trim() === '') {
      setStatusPerfil({ tipo: 'erro', msg: 'O nome não pode ficar em branco.' });
      return;
    }
    
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

    if (novaSenha.length < 6) {
      setStatusSenha({ tipo: 'erro', msg: 'A nova senha deve ter no mínimo 6 caracteres.' });
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
      let backendMsg = 'Erro ao alterar senha. Tente novamente.';

      if (error.response?.data?.mensagem) {
        backendMsg = error.response.data.mensagem;
      }
      else if (error.response?.data?.errors) {
        const errosDeValidacao = error.response.data.errors;
        const primeiroCampo = Object.keys(errosDeValidacao)[0];

        if (primeiroCampo && errosDeValidacao[primeiroCampo].length > 0) {
          backendMsg = errosDeValidacao[primeiroCampo][0];
        }
      }

      setStatusSenha({ tipo: 'erro', msg: backendMsg });
    }
  };

  return (
      <div className="dashboard-layout">
        {tipoPerfil === 'Gestor' ? (
            <SidebarGestor activePath="/home/perfil" />
        ) : (
            <Sidebar
                activePath="/home/perfil"
                isOpen={menuMobileAberto}
                onClose={() => setMenuMobileAberto(false)}
            />
        )}

        {menuMobileAberto && (
            <div className="sidebar-overlay" onClick={() => setMenuMobileAberto(false)}></div>
        )}

        <TopBar onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)} />

        <main className="dashboard-main">
          <div className="perfil-container">
            <button
                onClick={() => navigate(tipoPerfil === 'Gestor' ? '/gestor' : '/home')}
                className="perfil-btn-voltar"
            >
              ← Voltar ao Painel
            </button>

            <h1>Meu Perfil</h1>
            <p className="perfil-subtitulo-page">Gerencie suas informações pessoais e de segurança.</p>

            <div className="perfil-card">

              <div className="perfil-header-info" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>

                {/* 1. O Avatar */}
                <div className="perfil-avatar-wrapper" style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
                  <div className="perfil-avatar-grande" style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2A2D3E', border: '3px solid #00B4D8' }}>
                    {fotoPreview || fotoPerfilUrl ? (
                        <img src={fotoPreview || fotoPerfilUrl || ''} alt="Perfil" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                    ) : (
                        <span style={{ fontSize: '48px', color: '#fff' }}>{nome ? nome.charAt(0).toUpperCase() : 'U'}</span>
                    )}
                  </div>

                  <label className="perfil-change-photo" title="Alterar foto">
                    <input type="file" style={{display: 'none'}} accept="image/png, image/jpeg, image/webp" onChange={handleFotoChange} disabled={isUploading} />
                    <span>{isUploading ? '⌛' : '📸'}</span>
                  </label>
                </div>

                <div className="perfil-header-text" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h2>{nome || 'Carregando...'}</h2>
                  <p>Plano atual: <strong style={{color: '#00B4D8'}}>{tipoPerfil || 'Carregando...'}</strong></p>

                  {/* MOSTRA A DATA DE VENCIMENTO AQUI */}
                  {vencimentoPlano && tipoPerfil !== 'Gestor' && (
                      <p style={{ marginTop: '4px' }}>Válido até: <strong>{vencimentoPlano}</strong></p>
                  )}

                  {(fotoPerfilUrl || fotoPreview) && (
                      <button
                          onClick={() => setMostrarModalRemover(true)}
                          disabled={isUploading}
                          style={{
                            marginTop: '12px', padding: '6px 12px', width: 'fit-content',
                            backgroundColor: 'rgba(255, 77, 79, 0.1)', color: '#ff4d4f', border: '1px solid #ff4d4f',
                            borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
                            transition: 'background 0.2s'
                          }}
                      >
                        {isUploading ? 'Processando...' : '🗑️ Remover Foto'}
                      </button>
                  )}
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

            {!ehSocial ? (
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
            ) : (
                <div className="perfil-card social-notice" style={{ marginTop: '24px' }}>
                  <h2 style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>Segurança da Conta</h2>
                  <p>Você entrou com uma conta vinculada ao Google ou Microsoft.</p>
                  <p>A alteração e gestão da sua senha devem ser feitas diretamente nas configurações do provedor da sua conta.</p>
                </div>
            )}

            <div className="perfil-card" style={{ marginTop: '24px', border: '1px solid #ff4d4f' }}>
              <h2 style={{ color: '#ff4d4f', fontSize: '20px', marginBottom: '8px' }}>Zona de Perigo</h2>
              <p className="perfil-subtitulo-page" style={{ marginBottom: '24px' }}>
                Ao excluir sua conta, todos os seus dados e configurações serão apagados permanentemente. Esta ação não pode ser desfeita.
              </p>
              <button
                  onClick={() => setMostrarModalExcluirConta(true)}
                  style={{ background: '#ff4d4f', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Excluir Minha Conta
              </button>
            </div>

            {mostrarModalRemover && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <div style={{
                    backgroundColor: '#1E2130', padding: '24px', borderRadius: '12px',
                    maxWidth: '400px', textAlign: 'center', border: '1px solid #3A3D4E',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                  }}>
                    <h3 style={{ color: '#fff', marginBottom: '12px', fontSize: '18px' }}>Remover Foto</h3>
                    <p style={{ color: '#aaa', marginBottom: '24px', fontSize: '14px', lineHeight: '1.5' }}>
                      Tem certeza que deseja remover sua foto de perfil? Essa ação não pode ser desfeita.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <button
                          onClick={() => setMostrarModalRemover(false)}
                          style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #555', color: '#ccc', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                      <button
                          onClick={handleRemoverFoto}
                          style={{ padding: '8px 16px', background: '#ff4d4f', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Sim, remover
                      </button>
                    </div>
                  </div>
                </div>
            )}

            {mostrarModalExcluirConta && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ backgroundColor: '#1E2130', padding: '32px', borderRadius: '12px', maxWidth: '400px', textAlign: 'center', border: '1px solid #ff4d4f', boxShadow: '0 8px 32px rgba(255, 77, 79, 0.2)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                    <h3 style={{ color: '#fff', marginBottom: '12px', fontSize: '20px' }}>Você tem certeza absoluta?</h3>
                    <p style={{ color: '#aaa', marginBottom: '24px', fontSize: '14px', lineHeight: '1.5' }}>
                      Isso apagará seu histórico, carteiras, foto de perfil e acesso ao sistema. <strong>Não há como reverter isso.</strong>
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <button onClick={() => setMostrarModalExcluirConta(false)} disabled={isExcluindoConta} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #555', color: '#ccc', borderRadius: '6px', cursor: 'pointer' }}>
                        Cancelar
                      </button>
                      <button onClick={handleExcluirConta} disabled={isExcluindoConta} style={{ padding: '10px 20px', background: '#ff4d4f', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                        {isExcluindoConta ? 'Excluindo...' : 'Sim, excluir tudo'}
                      </button>
                    </div>
                  </div>
                </div>
            )}

          </div>
        </main>
      </div>
  );
}