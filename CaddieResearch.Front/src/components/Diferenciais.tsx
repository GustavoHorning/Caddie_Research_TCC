import './Diferenciais.css';

const diferenciais = [
  {
    icon: '🔍',
    titulo: 'Análise Profunda',
    descricao:
      'Nossos relatórios vão além dos números. Combinamos fundamentos, cenário macroeconômico e valuation para entregar análises completas.',
  },
  {
    icon: '⚡',
    titulo: 'Atualização Constante',
    descricao:
      'Acompanhe resultados trimestrais, eventos relevantes e revisões de preço-alvo em tempo real, sem perder nenhuma movimentação importante.',
  },
  {
    icon: '🎯',
    titulo: 'Carteiras Recomendadas',
    descricao:
      'Portfólios montados por especialistas com diferentes perfis de risco — do conservador ao arrojado — para você investir com estratégia.',
  },
  {
    icon: '📚',
    titulo: 'Papers Econômicos',
    descricao:
      'Acesse estudos e papers exclusivos sobre tendências, setores e conjuntura econômica para embasar suas decisões de longo prazo.',
  },
];

export default function Diferenciais() {
  return (
    <section className="diferenciais" id="diferenciais">
      <div className="diferenciais-container">
        <div className="section-label">Por que a Caddie Research?</div>
        <h2 className="section-title">Inteligência que move o seu portfólio</h2>
        <p className="section-subtitle">
          Tudo que você precisa para investir com mais segurança e consistência, em um só lugar.
        </p>

        <div className="diferenciais-grid">
          {diferenciais.map((item, index) => (
            <div className="diferencial-card" key={index}>
              <div className="diferencial-icon">{item.icon}</div>
              <h3 className="diferencial-titulo">{item.titulo}</h3>
              <p className="diferencial-descricao">{item.descricao}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}