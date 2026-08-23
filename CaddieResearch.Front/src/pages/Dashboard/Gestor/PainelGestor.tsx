import { useState, useEffect } from 'react'
import './PainelGestor.css'
import TopBar from '../../../components/TopBar'
import api from '../../../services/api'
import SidebarGestor from '../../../components/SidebarGestor'

export default function PainelGestor() {
  const [menuMobileAberto, setMenuMobileAberto] = useState(false)

  const [carteirasDisponiveis, setCarteirasDisponiveis] = useState<any[]>([])
  const [carteiraAtivosId, setCarteiraAtivosId] = useState('')
  const [ativosTabela, setAtivosTabela] = useState<any[]>([])
  const [carregandoAtivos, setCarregandoAtivos] = useState(false)
  const [termoBusca, setTermoBusca] = useState('')

  const [mostrarFormAtivo, setMostrarFormAtivo] = useState(false)
  const [ativoEditandoId, setAtivoEditandoId] = useState<number | null>(null)

  const [formTicker, setFormTicker] = useState('')
  const [formEmpresa, setFormEmpresa] = useState('')
  const [formPrecoTeto, setFormPrecoTeto] = useState('')
  const [formVies, setFormVies] = useState('Comprar')
  const [formRentabilidade, setFormRentabilidade] = useState('')
  const [formVencimento, setFormVencimento] = useState('')
  const [formLiquidez, setFormLiquidez] = useState('')

  const [formCnpj, setFormCnpj] = useState('')
  const [formTaxaAdm, setFormTaxaAdm] = useState('')

  const [formDataEntrada, setFormDataEntrada] = useState('')
  const [formCategoria, setFormCategoria] = useState('')

  const [toastMsg, setToastMsg] = useState('');
  const [toastTipo, setToastTipo] = useState<'sucesso' | 'erro'>('sucesso');

  // Recomendações para clientes
  const [clientes, setClientes] = useState<{id: number; nome: string; email: string}[]>([])
  const [modalRec, setModalRec] = useState(false)
  const [recForm, setRecForm] = useState({ clienteId: '', ticker: '', nomeAtivo: '', classeAtivo: 'Renda Variável', quantidade: '', precoSugerido: '', descricao: '' })
  const [enviandoRec, setEnviandoRec] = useState(false)
  const [recsEnviadas, setRecsEnviadas] = useState<any[]>([])
  const [ativoParaRemover, setAtivoParaRemover] = useState<{id: number, ticker: string} | null>(null);

  const configSeguranca = { headers: { Authorization: `Bearer ${localStorage.getItem('caddie_token')}` } };

  const idCarteiraNum = parseInt(carteiraAtivosId || '0');
  const isFundos = idCarteiraNum === 6;
  const isRendaFixa = idCarteiraNum === 7;
  const isReserva = idCarteiraNum === 8;
  const isRendaVariavel = ![6, 7, 8].includes(idCarteiraNum);

  const carteiraAtual = carteirasDisponiveis.find(c => c.id === idCarteiraNum);
  const nomeCarteira = carteiraAtual?.nome?.toLowerCase() || '';

  const isInternacional = nomeCarteira.includes('internacional') || nomeCarteira.includes('exterior') || nomeCarteira.includes('global');
  const isFii = nomeCarteira.includes('fii') || nomeCarteira.includes('imobiliário') || nomeCarteira.includes('imobiliarios');

  const placeholderTicker = isInternacional ? "Ex: AAPL" : isFii ? "Ex: HGLG11" : "Ex: PETR4";
  const placeholderEmpresa = isInternacional ? "Ex: Apple Inc." : isFii ? "Ex: CSHG Logística" : "Ex: Petrobras S.A.";
  const placeholderPreco = isInternacional ? "Ex: 185.50" : "Ex: 42.50";
  const [listaTickers, setListaTickers] = useState<string[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [listaTickersInternacionais, setListaTickersInternacionais] = useState<string[]>([]);
  const listaCorretaParaFiltro = isInternacional ? listaTickersInternacionais : listaTickers;
  const sugestoesTickers = formTicker.length > 0
      ? listaCorretaParaFiltro
          .filter(t => t.toLowerCase().includes(formTicker.toLowerCase()))
          .slice(0, 8)
      : [];
  


  useEffect(() => {
    if (!ativoEditandoId) {
      if (isFundos) setFormCategoria('Ações');
      else if (isRendaFixa || isReserva) setFormCategoria('Pós-fixado');
      else setFormCategoria('');
    }
  }, [carteiraAtivosId, isFundos, isRendaFixa, isReserva, ativoEditandoId]);

  useEffect(() => {
    api.get('/api/carteiras', configSeguranca)
        .then(res => {
          setCarteirasDisponiveis(res.data)
          if (res.data.length > 0) {
            setCarteiraAtivosId(res.data[0].id.toString())
          }
        })
        .catch(err => console.error("Erro ao carregar carteiras:", err))
  }, [])

  useEffect(() => {
    if (!carteiraAtivosId) return;

    setCarregandoAtivos(true);
    setMostrarFormAtivo(false);
    setTermoBusca('');

    api.get(`/api/carteiras/${carteiraAtivosId}`, configSeguranca)
        .then(res => {
          setAtivosTabela(res.data.ativos || [])
        })
        .catch(err => console.error("Erro ao carregar ativos:", err))
        .finally(() => setCarregandoAtivos(false))
  }, [carteiraAtivosId])

  useEffect(() => {
    api.get('/api/acoes/disponiveis', configSeguranca)
        .then(res => setListaTickers(res.data))
        .catch(err => console.error("Erro ao carregar tickers BR:", err));

    api.get('/api/acoes/disponiveis/internacionais', configSeguranca)
        .then(res => setListaTickersInternacionais(res.data))
        .catch(err => console.error("Erro ao carregar tickers Internacionais:", err));
  }, []);

  const ativosFiltrados = ativosTabela.filter(ativo =>
      ativo.ticker.toLowerCase().includes(termoBusca.toLowerCase()) ||
      (ativo.nomeEmpresa && ativo.nomeEmpresa.toLowerCase().includes(termoBusca.toLowerCase()))
  );

  const totalAtivos = ativosTabela.length;
  const qtdComprar = ativosTabela.filter(a => a.vies === 'Comprar').length;
  const qtdVenderAguardar = totalAtivos - qtdComprar;
  const pctComprar = totalAtivos > 0 ? Math.round((qtdComprar / totalAtivos) * 100) : 0;
  const pctVenderAguardar = totalAtivos > 0 ? Math.round((qtdVenderAguardar / totalAtivos) * 100) : 0;

  const handleEditarClique = (ativo: any) => {
    setFormTicker(ativo.ticker)
    setFormVies(ativo.vies)
    setFormDataEntrada(ativo.dataEntrada ? ativo.dataEntrada.substring(0, 10) : '')
    setFormCategoria(ativo.categoria || '')

    if (isFundos) {
      setFormCnpj(ativo.nomeEmpresa || '')
      setFormTaxaAdm(ativo.rentabilidade || '')
    } else if (isRendaFixa || isReserva) {
      setFormRentabilidade(ativo.rentabilidade || '')
      setFormVencimento(ativo.vencimento || '')
      setFormLiquidez(ativo.liquidez || '')
    } else {
      setFormEmpresa(ativo.nomeEmpresa || '')
      setFormPrecoTeto(ativo.precoTeto ? ativo.precoTeto.toString() : '')
    }

    setAtivoEditandoId(ativo.id)
    setMostrarFormAtivo(true)
  }

  const handleSalvarAtivo = async () => {
    const tickerLimpo = formTicker.trim().toUpperCase();

    if (!tickerLimpo) return mostrarNotificacao("O Ticker/Nome do ativo é obrigatório!", "erro");
    if (!formDataEntrada) return mostrarNotificacao("A Data de Recomendação é obrigatória!", "erro");

    const dataEntradaObj = new Date(formDataEntrada + "T00:00:00"); 
    const dataHoje = new Date();
    dataHoje.setHours(0, 0, 0, 0); 

    if (dataEntradaObj > dataHoje) {
      return mostrarNotificacao("A Data de Recomendação não pode estar no futuro.", "erro");
    }

    if (isRendaVariavel) {
      if (!formPrecoTeto || parseFloat(formPrecoTeto.replace(',', '.')) <= 0) {
        return mostrarNotificacao("Defina um Preço Teto válido maior que zero.", "erro");
      }
    }

    if (isFundos) {
      if (!formCnpj) return mostrarNotificacao("O CNPJ do Fundo é obrigatório.", "erro");
      if (!formTaxaAdm) return mostrarNotificacao("A Taxa de Administração é obrigatória.", "erro");
      if (!formLiquidez) return mostrarNotificacao("O prazo de Liquidez (Resgate) é obrigatório.", "erro");
    }

    if (isRendaFixa || isReserva) {
      if (!formRentabilidade) return mostrarNotificacao("A Taxa de Entrada é obrigatória.", "erro");
      if (!formVencimento) return mostrarNotificacao("O Vencimento é obrigatório.", "erro");

      const dataVencimentoObj = new Date(formVencimento + "T00:00:00");

      if (dataVencimentoObj <= dataEntradaObj) {
        return mostrarNotificacao("O Vencimento deve ser posterior à Data de Entrada.", "erro");
      }
      if (dataVencimentoObj < dataHoje) {
        return mostrarNotificacao("Não é possível cadastrar um título que já venceu.", "erro");
      }
    }

    const ativoJaExiste = ativosTabela.some(a => a.ticker.toUpperCase() === tickerLimpo && a.id !== ativoEditandoId);

    if (ativoJaExiste) {
      return mostrarNotificacao(`O ativo ${tickerLimpo} já está recomendado nesta carteira!`, "erro");
    }

    const payload = {
      ticker: tickerLimpo,
      nomeEmpresa: isFundos ? formCnpj.trim() : formEmpresa.trim(),
      precoTeto: isRendaVariavel ? parseFloat(formPrecoTeto.replace(',', '.')) : null,
      vies: formVies,
      carteiraId: idCarteiraNum,
      rentabilidade: isFundos ? formTaxaAdm.trim() : (isRendaFixa || isReserva ? formRentabilidade.trim() : null),
      vencimento: (isRendaFixa || isReserva) ? formVencimento.trim() : null,
      liquidez: isReserva ? "D+0 (Imediata)" : ((isRendaFixa || isFundos) ? formLiquidez.trim() : null),
      dataEntrada: formDataEntrada,
      categoria: formCategoria || null
    }

    try {
      if (ativoEditandoId) {
        await api.put(`/api/ativos/${ativoEditandoId}`, payload, configSeguranca)
        mostrarNotificacao("Recomendação atualizada com sucesso!", "sucesso")
      } else {
        await api.post('/api/ativos', payload, configSeguranca)
        mostrarNotificacao("Novo ativo cadastrado com sucesso!", "sucesso")
      }

      setCarregandoAtivos(true);
      const res = await api.get(`/api/carteiras/${carteiraAtivosId}`, configSeguranca)
      setAtivosTabela(res.data.ativos || [])
      setCarregandoAtivos(false);

      handleCancelarForm()
    } catch (error) {
      console.error(error)
      mostrarNotificacao("Erro ao salvar. Verifique a conexão.", "erro")
    }
  }

  const handleCancelarForm = () => {
    setMostrarFormAtivo(false)
    setAtivoEditandoId(null)
    setFormTicker('')
    setFormEmpresa('')
    setFormPrecoTeto('')
    setFormVies('Comprar')
    setFormRentabilidade('')
    setFormVencimento('')
    setFormLiquidez('')
    setFormCnpj('')
    setFormTaxaAdm('')
    setFormDataEntrada('')
    setFormCategoria('')
  }

  const handleAbrirModalRemover = (idAtivo: number, ticker: string) => {
    setAtivoParaRemover({ id: idAtivo, ticker: ticker });
  }

  const handleConfirmarRemocao = async () => {
    if (!ativoParaRemover) return;
    try {
      await api.delete(`/api/ativos/${ativoParaRemover.id}`, configSeguranca);
      mostrarNotificacao(`${ativoParaRemover.ticker} removido da carteira!`, "sucesso");
      setCarregandoAtivos(true);
      const res = await api.get(`/api/carteiras/${carteiraAtivosId}`, configSeguranca);
      setAtivosTabela(res.data.ativos || []);
      setCarregandoAtivos(false);
    } catch (error) {
      console.error(error);
      mostrarNotificacao("Erro ao remover o ativo.", "erro");
    } finally {
      setAtivoParaRemover(null);
    }
  }

  useEffect(() => {
    api.get('/api/recomendacoes/clientes', configSeguranca).then(r => setClientes(r.data)).catch(() => {})
    api.get('/api/recomendacoes/enviadas', configSeguranca).then(r => setRecsEnviadas(r.data)).catch(() => {})
  }, [])

  async function enviarRecomendacao() {
    if (!recForm.clienteId || !recForm.ticker || !recForm.quantidade || !recForm.precoSugerido) return
    setEnviandoRec(true)
    try {
      await api.post('/api/recomendacoes', {
        clienteId: parseInt(recForm.clienteId),
        ticker: recForm.ticker,
        nomeAtivo: recForm.nomeAtivo,
        classeAtivo: recForm.classeAtivo,
        quantidade: parseFloat(recForm.quantidade),
        precoSugerido: parseFloat(recForm.precoSugerido),
        descricao: recForm.descricao,
        origem: 'Painel'
      }, configSeguranca)
      setModalRec(false)
      setRecForm({ clienteId: '', ticker: '', nomeAtivo: '', classeAtivo: 'Renda Variável', quantidade: '', precoSugerido: '', descricao: '' })
      const r = await api.get('/api/recomendacoes/enviadas', configSeguranca)
      setRecsEnviadas(r.data)
      mostrarNotificacao('Recomendação enviada!', 'sucesso')
    } catch { mostrarNotificacao('Erro ao enviar recomendação.', 'erro') }
    finally { setEnviandoRec(false) }
  }

  const mostrarNotificacao = (msg: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    setToastMsg(msg);
    setToastTipo(tipo);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const inpStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', color: '#e6edf3', fontSize: '0.9rem', outline: 'none' }
  const selStyle: React.CSSProperties = { ...inpStyle, cursor: 'pointer' }

  return (
      <div className="dashboard-layout">
        <SidebarGestor activePath="/gestor" isOpen={menuMobileAberto} onClose={() => setMenuMobileAberto(false)} />
        {menuMobileAberto && <div className="sidebar-overlay" onClick={() => setMenuMobileAberto(false)}></div>}

        <TopBar userName="Gestor" onMenuToggle={() => setMenuMobileAberto(!menuMobileAberto)} />

        <main className="dashboard-main">
          <div className="gestor-content">

            <div className="gestor-header-title">
              <h2>Visão Geral da Carteira</h2>
              <p>Gerencie as recomendações, preços teto e rentabilidades.</p>
            </div>

            <div className="gestor-metricas">
              <div className="gestor-metrica-card">
                <div className="gestor-metrica-header-kpi">
                  <span className="gestor-metrica-label">Total de Ativos</span>
                  <span className="gestor-metrica-badge" style={{ color: '#00B4D8', background: 'rgba(0, 180, 216, 0.1)' }}>100%</span>
                </div>
                <span className="gestor-metrica-valor">{totalAtivos}</span>
                <div className="gestor-barra-bg">
                  <div className="gestor-barra-fill" style={{ width: '100%', backgroundColor: '#00B4D8' }}></div>
                </div>
              </div>
              <div className="gestor-metrica-card">
                <div className="gestor-metrica-header-kpi">
                  <span className="gestor-metrica-label">Índice de Convicção</span>
                  <span className="gestor-metrica-badge" style={{ color: '#4caf50', background: 'rgba(76, 175, 80, 0.1)' }}>{pctComprar}%</span>
                </div>
                <span className="gestor-metrica-valor" style={{ color: '#4caf50' }}>{qtdComprar}</span>
                <div className="gestor-barra-bg">
                  <div className="gestor-barra-fill" style={{ width: `${pctComprar}%`, backgroundColor: '#4caf50' }}></div>
                </div>
              </div>
              <div className="gestor-metrica-card">
                <div className="gestor-metrica-header-kpi">
                  <span className="gestor-metrica-label">Aguardar / Venda</span>
                  <span className="gestor-metrica-badge" style={{ color: '#ff9800', background: 'rgba(255, 152, 0, 0.1)' }}>{pctVenderAguardar}%</span>
                </div>
                <span className="gestor-metrica-valor" style={{ color: '#ff9800' }}>{qtdVenderAguardar}</span>
                <div className="gestor-barra-bg">
                  <div className="gestor-barra-fill" style={{ width: `${pctVenderAguardar}%`, backgroundColor: '#ff9800' }}></div>
                </div>
              </div>
            </div>

            <div className="gestor-tabs-container">
              {carteirasDisponiveis.map(c => (
                  <button
                      key={c.id}
                      className={`gestor-tab ${carteiraAtivosId === c.id.toString() ? 'active' : ''}`}
                      onClick={() => setCarteiraAtivosId(c.id.toString())}
                  >
                    {c.nome}
                  </button>
              ))}
            </div>

            <div className="gestor-card">
              <div className="gestor-ativos-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '16px' }}>
                <div className="gestor-busca">
                  <input type="text" placeholder="Buscar ticker..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} />
                </div>
                <button className="gestor-btn-novo-ativo" onClick={() => { setMostrarFormAtivo(true); setAtivoEditandoId(null); }}>
                  + Novo ativo
                </button>
              </div>

              {mostrarFormAtivo && (
                  <div className="modal-cadastro-overlay">
                    <div className="modal-cadastro-content">

                      <div className="modal-cadastro-header">
                        <h3>{ativoEditandoId ? "Editar Recomendação" : "Nova Recomendação"}</h3>
                        <button className="modal-btn-fechar" onClick={handleCancelarForm}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>

                      <div className="gestor-form-grid">

                        <div className="gestor-upload-campos">

                          <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(0, 180, 216, 0.05)', borderRadius: '8px', borderLeft: '4px solid #00B4D8' }}>
                            <strong style={{ color: '#00B4D8', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                              {isFundos ? 'Cadastrando Fundo de Investimento' :
                                  isReserva ? 'Cadastrando Reserva de Emergência' :
                                      isRendaFixa ? 'Cadastrando Título de Renda Fixa' :
                                          'Cadastrando Ativo de Renda Variável'}
                            </strong>
                          </div>

                          {isRendaVariavel && (
                              <>
                                <div className="gestor-campo-row">
                                  <div className="gestor-campo" style={{ position: 'relative' }}>
                                    <label>Ticker</label>
                                    <input
                                        type="text"
                                        placeholder={placeholderTicker}
                                        value={formTicker}
                                        onChange={e => {
                                          setFormTicker(e.target.value.toUpperCase());
                                          setMostrarSugestoes(true);
                                        }}
                                        onFocus={() => setMostrarSugestoes(true)}
                                        onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)}
                                    />

                                    {mostrarSugestoes && sugestoesTickers.length > 0 && (
                                        <ul style={{
                                          position: 'absolute',
                                          top: '100%',
                                          left: 0,
                                          right: 0,
                                          backgroundColor: '#111',
                                          border: '1px solid rgba(0, 180, 216, 0.3)',
                                          borderRadius: '8px',
                                          marginTop: '4px',
                                          padding: 0,
                                          margin: '4px 0 0 0',
                                          listStyle: 'none',
                                          zIndex: 50,
                                          maxHeight: '150px',
                                          overflowY: 'auto',
                                          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                        }}>
                                          {sugestoesTickers.map(t => (
                                              <li
                                                  key={t}
                                                  onClick={() => {
                                                    setFormTicker(t);
                                                    setMostrarSugestoes(false);
                                                  }}
                                                  style={{
                                                    padding: '10px 12px',
                                                    cursor: 'pointer',
                                                    color: '#fff',
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                    transition: 'background 0.2s'
                                                  }}
                                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 180, 216, 0.15)'}
                                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                              >
                                                <strong style={{ color: '#00B4D8' }}>{t}</strong>
                                              </li>
                                          ))}
                                        </ul>
                                    )}
                                  </div>
                                  <div className="gestor-campo" style={{ flex: 2 }}>
                                    <label>Nome da Empresa / Fundo</label>
                                    <input
                                        type="text"
                                        placeholder={placeholderEmpresa}
                                        value={formEmpresa}
                                        onChange={e => setFormEmpresa(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="gestor-campo-row">
                                  <div className="gestor-campo">
                                    <label>Preço Teto Alvo {isInternacional && "(USD)"}</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder={placeholderPreco}
                                        value={formPrecoTeto}
                                        onChange={e => setFormPrecoTeto(e.target.value)}
                                    />
                                  </div>
                                  <div className="gestor-campo">
                                    <label>Viés Estratégico</label>
                                    <select value={formVies} onChange={e => setFormVies(e.target.value)}>
                                      <option value="Comprar">Comprar</option>
                                      <option value="Aguardar">Aguardar</option>
                                      <option value="Vender">Vender</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="gestor-campo-row">
                                  <div className="gestor-campo">
                                    <label>Data de Recomendação</label>
                                    <input type="date" value={formDataEntrada} onChange={e => setFormDataEntrada(e.target.value)} />
                                  </div>
                                  <div className="gestor-campo"></div>
                                </div>
                              </>
                          )}

                          {isFundos && (
                              <>
                                <div className="gestor-campo-row">
                                  <div className="gestor-campo" style={{ flex: 2 }}>
                                    <label>Nome do Fundo</label>
                                    <input type="text" placeholder="Ex: Alaska Black FIC FIA" value={formTicker} onChange={e => setFormTicker(e.target.value)} />
                                  </div>
                                  <div className="gestor-campo">
                                    <label>CNPJ do Fundo</label>
                                    <input type="text" placeholder="00.000.000/0001-00" value={formCnpj} onChange={e => setFormCnpj(e.target.value)} />
                                  </div>
                                </div>
                                <div className="gestor-campo-row">
                                  <div className="gestor-campo">
                                    <label>Taxa de Administração</label>
                                    <input type="text" placeholder="Ex: 2% a.a." value={formTaxaAdm} onChange={e => setFormTaxaAdm(e.target.value)} />
                                  </div>
                                  <div className="gestor-campo">
                                    <label>Classificação</label>
                                    <select value={formCategoria} onChange={e => setFormCategoria(e.target.value)}>
                                      <option value="Ações">Fundo de Ações</option>
                                      <option value="Multimercado">Fundo Multimercado</option>
                                      <option value="Renda Fixa">Fundo de Renda Fixa</option>
                                      <option value="Cambial">Fundo Cambial</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="gestor-campo-row">
                                  <div className="gestor-campo">
                                    <label>Liquidez (Resgate)</label>
                                    <input type="text" placeholder="Ex: D+30" value={formLiquidez} onChange={e => setFormLiquidez(e.target.value)} />
                                  </div>
                                  <div className="gestor-campo">
                                    <label>Data de Recomendação</label>
                                    <input type="date" value={formDataEntrada} onChange={e => setFormDataEntrada(e.target.value)} />
                                  </div>
                                </div>
                                <div className="gestor-campo-row">
                                  <div className="gestor-campo">
                                    <label>Recomendação</label>
                                    <select value={formVies} onChange={e => setFormVies(e.target.value)}>
                                      <option value="Comprar">Alocar</option>
                                      <option value="Aguardar">Manter Posição</option>
                                      <option value="Vender">Resgatar</option>
                                    </select>
                                  </div>
                                  <div className="gestor-campo"></div>
                                </div>
                              </>
                          )}

                          {(isRendaFixa || isReserva) && (
                              <>
                                <div className="gestor-campo-row">
                                  <div className="gestor-campo" style={{ flex: 2 }}>
                                    <label>Nome do Título</label>
                                    <input type="text" placeholder={isReserva ? "Ex: CDB Liquidez Diária" : "Ex: Tesouro IPCA+ 2035"} value={formTicker} onChange={e => setFormTicker(e.target.value)} />
                                  </div>
                                  <div className="gestor-campo">
                                    <label>Taxa Entrada</label>
                                    <input type="text" placeholder={isReserva ? "Ex: 100% do CDI" : "Ex: IPCA + 6%"} value={formRentabilidade} onChange={e => setFormRentabilidade(e.target.value)} />
                                  </div>
                                </div>

                                <div className="gestor-campo-row">
                                  <div className="gestor-campo">
                                    <label>Tipo</label>
                                    <select value={formCategoria} onChange={e => setFormCategoria(e.target.value)}>
                                      <option value="Pós-fixado">Pós-fixado</option>
                                      <option value="Pré-fixado">Pré-fixado</option>
                                      <option value="Atrelado à Inflação">Atrelado à Inflação</option>
                                    </select>
                                  </div>
                                  <div className="gestor-campo">
                                    <label>Liquidez</label>
                                    {isReserva ? (
                                        <input type="text" value="D+0 (Imediata)" disabled style={{ opacity: 0.5, cursor: 'not-allowed', color: '#4caf50' }} />
                                    ) : (
                                        <input type="text" placeholder="Ex: D+30 ou No Vencimento" value={formLiquidez} onChange={e => setFormLiquidez(e.target.value)} />
                                    )}
                                  </div>
                                </div>

                                <div className="gestor-campo-row">
                                  <div className="gestor-campo">
                                    <label>Data Entrada</label>
                                    <input type="date" value={formDataEntrada} onChange={e => setFormDataEntrada(e.target.value)} />
                                  </div>
                                  <div className="gestor-campo">
                                    <label>Vencimento</label>
                                    <input type="date" value={formVencimento} onChange={e => setFormVencimento(e.target.value)} />
                                  </div>
                                </div>

                                <div className="gestor-campo-row">
                                  <div className="gestor-campo">
                                    <label>Recomendação</label>
                                    <select value={formVies} onChange={e => setFormVies(e.target.value)}>
                                      <option value="Comprar">Alocar</option>
                                      <option value="Aguardar">Aguardar Taxas</option>
                                      <option value="Vender">Vender Antecipado</option>
                                    </select>
                                  </div>
                                  <div className="gestor-campo"></div>
                                </div>
                              </>
                          )}

                          <div className="gestor-form-acoes">
                            <button className="gestor-btn-cancelar" onClick={handleCancelarForm}>Cancelar</button>
                            <button className="gestor-btn-publicar" onClick={handleSalvarAtivo}>
                              {ativoEditandoId ? "Salvar Alterações" : "Adicionar à Carteira"}
                            </button>
                          </div>
                        </div>

                        <div className="gestor-live-preview">
                          <span className="preview-label">Live Preview</span>
                          <div className="preview-card-wrapper">
                            <div style={{ background: '#111', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                                <div>
                                  <strong style={{ fontSize: '1.1rem', color: '#fff', wordBreak: 'break-word', display: 'block' }}>
                                    {formTicker ? formTicker.toUpperCase() : 'NOME / TICKER'}
                                  </strong>
                                  {formCategoria && (
                                      <span style={{ fontSize: '10px', color: '#00B4D8', fontWeight: 600, textTransform: 'uppercase' }}>
                                    {formCategoria}
                                  </span>
                                  )}
                                </div>
                                <span style={{
                                  backgroundColor: formVies.includes('Comprar') || formVies === 'Alocar' ? '#10b981' : formVies.includes('Vender') || formVies === 'Resgatar' ? '#ef4444' : '#f59e0b',
                                  color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', height: 'fit-content', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                                }}>
                                  {isFundos
                                      ? (formVies === 'Comprar' ? 'Alocar' : formVies === 'Vender' ? 'Resgatar' : 'Manter Posição')
                                      : (isRendaFixa || isReserva)
                                          ? (formVies === 'Comprar' ? 'Alocar' : formVies === 'Vender' ? 'Vender Antecipado' : 'Aguardar Taxas')
                                          : formVies}
                              </span>
                              </div>

                              <div style={{ marginTop: '12px', color: '#8b949e', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {isRendaVariavel && (
                                    <div>Preço Teto: <strong style={{color: '#fff'}}>{formPrecoTeto ? `R$ ${formPrecoTeto}` : '--'}</strong></div>
                                )}

                                {isFundos && (
                                    <>
                                      <div>Taxa Adm: <strong style={{color: '#93c5fd'}}>{formTaxaAdm || '--'}</strong></div>
                                      <div>CNPJ: <strong style={{color: '#fff'}}>{formCnpj || '--'}</strong></div>
                                      <div>Liq: <strong style={{color: '#fff'}}>{formLiquidez || '--'}</strong></div>
                                    </>
                                )}

                                {(isRendaFixa || isReserva) && (
                                    <>
                                      <div>Taxa Entrada: <strong style={{color: '#93c5fd'}}>{formRentabilidade || '--'}</strong></div>
                                      <div>Venc.: <strong style={{color: '#fff'}}>{formVencimento || '--'}</strong> | Liq: <strong style={{color: '#fff'}}>{isReserva ? 'D+0' : (formLiquidez || '--')}</strong></div>
                                    </>
                                )}

                                {formDataEntrada && (
                                    <div style={{ borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '4px', marginTop: '4px', fontSize: '11px', color: '#6e7681' }}>
                                      Recomendado em: <strong style={{ color: '#e6edf3' }}>{formDataEntrada.split('-').reverse().join('/')}</strong>
                                    </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
              )}

              <div className="gestor-tabela-wrapper">
                <table className="gestor-tabela">
                  <thead>
                  <tr>
                    <th>Ativo / Nome</th>
                    <th>{isFundos ? "CNPJ" : (isRendaFixa || isReserva) ? "Vencimento / Liq." : "Empresa"}</th>
                    <th className="td-right">{isFundos ? "Taxa Adm" : (isRendaFixa || isReserva ? "Taxa Entrada" : "Preço Teto")}</th>
                    <th className="td-center">Viés</th>
                    <th className="td-center">Ações</th>
                  </tr>
                  </thead>
                  <tbody>
                  {carregandoAtivos ? (
                      [1, 2, 3].map((skeleton) => (
                          <tr key={`skeleton-${skeleton}`}>
                            <td className="gestor-td-ticker"><div className="skeleton skeleton-text" style={{width: '60px', height: '20px'}}></div></td>
                            <td className="gestor-td-empresa"><div className="skeleton skeleton-text" style={{width: '120px', height: '16px'}}></div></td>
                            <td className="td-right"><div className="skeleton skeleton-text" style={{width: '80px', height: '20px', marginLeft: 'auto'}}></div></td>
                            <td className="td-center"><div className="skeleton skeleton-text" style={{width: '70px', height: '24px', margin: '0 auto', borderRadius: '12px'}}></div></td>
                            <td className="td-center"><div className="skeleton skeleton-text" style={{width: '60px', height: '24px', margin: '0 auto'}}></div></td>
                          </tr>
                      ))
                  ) : ativosFiltrados.length > 0 ? (
                      ativosFiltrados.map((ativo, i) => (
                          <tr key={i}>
                            <td className="gestor-td-ticker" data-label="Ativo">
                              {ativo.ticker}
                              {ativo.categoria && (
                                  <span style={{ display: 'block', fontSize: '10px', color: '#00B4D8', fontWeight: 500 }}>
                                  {ativo.categoria}
                                </span>
                              )}
                            </td>

                            <td className="gestor-td-empresa" data-label={isFundos ? "CNPJ" : (isRendaFixa || isReserva) ? "Vencimento" : "Empresa"}>
                              {isFundos ? (ativo.nomeEmpresa || '---') :
                                  (isRendaFixa || isReserva) ? (
                                          <>
                                            <div style={{ color: '#e6edf3' }}>
                                              {ativo.vencimento ? ativo.vencimento.split('-').reverse().join('/') : '---'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '2px' }}>
                                              Liq: {ativo.liquidez || '---'}
                                            </div>
                                          </>
                                      ) :
                                      (ativo.nomeEmpresa || '---')}
                            </td>

                            <td className="td-right" data-label={isFundos ? "Taxa Adm" : "Preço Teto"}>
                              {isRendaVariavel
                                  ? (ativo.precoTeto?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00')
                                  : (ativo.rentabilidade || '---')
                              }
                            </td>

                            <td className="td-center" data-label="Viés">
                              <span className={`gestor-vies vies-${ativo.vies.toLowerCase()}`}>
                                {isFundos
                                    ? (ativo.vies === 'Comprar' ? 'Alocar' : ativo.vies === 'Vender' ? 'Resgatar' : 'Manter Posição')
                                    : (isRendaFixa || isReserva)
                                        ? (ativo.vies === 'Comprar' ? 'Alocar' : ativo.vies === 'Vender' ? 'Vender Antecipado' : 'Aguardar Taxas')
                                        : ativo.vies}
                              </span>
                            </td>

                            <td className="td-center" data-label="Ações">
                              <div className="gestor-acoes-grupo">
                                <button className="btn-acao-svg btn-editar" onClick={() => handleEditarClique(ativo)} title="Editar Ativo">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                </button>
                                <button className="btn-acao-svg btn-remover" onClick={() => handleAbrirModalRemover(ativo.id, ativo.ticker)} title="Remover Ativo">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                      ))
                  ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>
                          {termoBusca ? "Nenhum ativo encontrado para esta busca." : "Nenhum ativo cadastrado nesta carteira."}
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEÇÃO: Recomendações para Clientes */}
            <div className="gestor-card" style={{ marginTop: 24 }}>
              <div className="gestor-ativos-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#e6edf3' }}>👍 Recomendações para Clientes</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#8b949e' }}>Envie recomendações de ativos diretamente para portfólios dos clientes.</p>
                </div>
                <button className="gestor-btn-novo-ativo" onClick={() => setModalRec(true)}>+ Nova Recomendação</button>
              </div>
              {recsEnviadas.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '28px', color: '#8b949e', fontSize: '0.87rem' }}>Nenhuma recomendação enviada ainda.</p>
              ) : (
                <div className="gestor-table-wrap">
                  <table className="gestor-table">
                    <thead><tr><th>Cliente</th><th>Ativo</th><th>Qtd</th><th>Preço Sug.</th><th>Status</th><th>Data</th></tr></thead>
                    <tbody>
                      {recsEnviadas.map((r: any) => (
                        <tr key={r.id}>
                          <td>{r.nomeCliente}</td>
                          <td><strong>{r.ticker}</strong> — {r.nomeAtivo}</td>
                          <td>{r.quantidade}</td>
                          <td>R$ {Number(r.precoSugerido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td><span style={{ fontSize: '0.78rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20, border: '1px solid', color: r.status === 'Aceita' ? '#22c55e' : r.status === 'Recusada' ? '#ef4444' : '#F59E0B', borderColor: r.status === 'Aceita' ? '#22c55e' : r.status === 'Recusada' ? '#ef4444' : '#F59E0B' }}>{r.status}</span></td>
                          <td>{new Date(r.dataCriacao).toLocaleDateString('pt-BR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Modal Nova Recomendação */}
          {modalRec && (
            <div className="gestor-modal-overlay" onClick={() => setModalRec(false)}>
              <div className="gestor-modal-box" style={{ width: 500, maxWidth: '95vw', background: '#161b22', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }} onClick={e => e.stopPropagation()}>
                <h3 style={{ margin: 0, color: '#e6edf3', fontSize: '1.05rem' }}>👍 Nova Recomendação para Cliente</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Cliente', col: '1/-1', el: <select style={selStyle} value={recForm.clienteId} onChange={e => setRecForm(p => ({ ...p, clienteId: e.target.value }))}>
                        <option value="">Selecione o cliente...</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.email})</option>)}
                      </select> },
                    { label: 'Ticker', el: <input style={inpStyle} type="text" placeholder="Ex: PETR4" value={recForm.ticker} onChange={e => setRecForm(p => ({ ...p, ticker: e.target.value.toUpperCase() }))} /> },
                    { label: 'Nome do Ativo', el: <input style={inpStyle} type="text" placeholder="Ex: Petrobras S.A." value={recForm.nomeAtivo} onChange={e => setRecForm(p => ({ ...p, nomeAtivo: e.target.value }))} /> },
                    { label: 'Classe', el: <select style={selStyle} value={recForm.classeAtivo} onChange={e => setRecForm(p => ({ ...p, classeAtivo: e.target.value }))}>
                        <option>Renda Variável</option><option>Renda Fixa</option><option>Internacional</option><option>Outros</option>
                      </select> },
                    { label: 'Quantidade', el: <input style={inpStyle} type="number" placeholder="Ex: 100" value={recForm.quantidade} onChange={e => setRecForm(p => ({ ...p, quantidade: e.target.value }))} /> },
                    { label: 'Preço Sugerido (R$)', el: <input style={inpStyle} type="number" placeholder="Ex: 38.50" value={recForm.precoSugerido} onChange={e => setRecForm(p => ({ ...p, precoSugerido: e.target.value }))} /> },
                    { label: 'Tese / Descrição (opcional)', col: '1/-1', el: <input style={inpStyle} type="text" placeholder="Ex: Empresa sólida com dividendos consistentes" value={recForm.descricao} onChange={e => setRecForm(p => ({ ...p, descricao: e.target.value }))} /> },
                  ].map(({ label, col, el }) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: col }}>
                      <label style={{ fontSize: '0.8rem', color: '#8b949e' }}>{label}</label>
                      {el}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                  <button className="gestor-btn-novo-ativo" onClick={enviarRecomendacao} disabled={enviandoRec}>{enviandoRec ? 'Enviando...' : 'Enviar Recomendação'}</button>
                  <button className="gestor-btn-cancelar" onClick={() => setModalRec(false)}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {ativoParaRemover && (
              <div className="gestor-modal-overlay">
                <div className="gestor-modal-box">
                  <div className="gestor-modal-icone">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </div>
                  <h3>Remover Recomendação</h3>
                  <p>Tem certeza que deseja remover <strong>{ativoParaRemover.ticker}</strong> desta carteira? Esta ação não pode ser desfeita.</p>
                  <div className="gestor-modal-acoes">
                    <button className="gestor-btn-cancelar" onClick={() => setAtivoParaRemover(null)}>Cancelar</button>
                    <button className="gestor-btn-remover-confirmar" onClick={handleConfirmarRemocao}>Sim, remover</button>
                  </div>
                </div>
              </div>
          )}
        </main>
        {toastMsg && (
            <div className={`gestor-toast toast-${toastTipo}`}>
              {toastMsg}
            </div>
        )}
      </div>
  )
}