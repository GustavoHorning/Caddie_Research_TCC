import './Produtos.css';

const produtos = [
  {
    tag: 'Renda Variável',
    titulo: 'Relatórios de Ações',
    descricao:
      'Análises fundamentalistas detalhadas de empresas listadas na B3. Cobertura de resultados, revisão de valuation e recomendação de compra, manutenção ou venda.',
    itens: ['Valuation (DCF e múltiplos)', 'Análise de balanço', 'Preço-alvo atualizado', 'Teses de investimento'],
    cor: '#00B4D8',
  },
  {
    tag: 'Fundos Imobiliários',
    titulo: 'Relatórios de FIIs',
    descricao:
      'Cobertura completa do mercado de fundos imobiliários. Analise dividendos, vacância, qualidade dos ativos e perspectivas de valorização.',
    itens: ['DY e P/VPA', 'Qualidade dos imóveis', 'Gestão e portfólio', 'Perspectivas de crescimento'],
    cor: '#0096c7',
  },
  {
    tag: 'Portfólios',
    titulo: 'Carteiras Recomendadas',
    descricao:
      'Portfólios montados e acompanhados por nossos analistas, com diferentes perfis de risco e objetivos de retorno. Atualizados mensalmente.',
    itens: ['Carteira conservadora', 'Carteira moderada', 'Carteira arrojada', 'Carteira de dividendos'],
    cor: '#48cae4',
  },
  {
    tag: 'Macroeconomia',
    titulo: 'Papers Econômicos',
    descricao:
      'Estudos aprofundados sobre cenário macroeconômico, tendências setoriais e impactos na bolsa. Conteúdo para quem quer pensar o longo prazo.',
    itens: ['Análise de juros e inflação', 'Cenário global', 'Setores em destaque', 'Perspectivas de mercado'],
    cor: '#023e8a',
  },
];

export default function Produtos() {
  return (
    <section className="produtos" id="produtos">
      <div className="produtos-container">
        <div className="section-label">Nossos Produtos</div>
        <h2 className="section-title">Uma cobertura completa do mercado</h2>
        <p className="section-subtitle">
          Da análise de ações ao cenário macro — temos o conteúdo certo para cada etapa da sua jornada como investidor.
        </p>

        <div className="produtos-grid">
          {produtos.map((produto, index) => (
            <div className="produto-card" key={index} style={{ '--card-color': produto.cor } as React.CSSProperties}>
              <div className="produto-tag" style={{ color: produto.cor, borderColor: produto.cor }}>
                {produto.tag}
              </div>
              <h3 className="produto-titulo">{produto.titulo}</h3>
              <p className="produto-descricao">{produto.descricao}</p>
              <ul className="produto-itens">
                {produto.itens.map((item, i) => (
                  <li key={i}>
                    <span className="produto-check" style={{ color: produto.cor }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}