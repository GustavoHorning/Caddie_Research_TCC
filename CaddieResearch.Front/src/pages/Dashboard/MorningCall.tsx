import './MorningCall.css';

interface Topico {
    titulo: string;
    texto: string;
    link: string;
}

// Dados mockados (por enquanto fixos; depois virão do backend)
const MORNING_CALL_MOCK = {
    titulo: 'Resumo do mercado — 25 de agosto',
    data: 'Segunda, 25/08/2026',
    cliente: 'João Silva',
    topicos: [
        {
            titulo: 'Petrobras anuncia novo plano de dividendos',
            texto: 'A estatal comunicou revisão em sua política de proventos, o que impacta diretamente sua posição em PETR4. Recomendo acompanhar os próximos comunicados, pois a mudança pode alterar o fluxo de dividendos que você recebe ao longo do ano.',
            link: 'https://valor.globo.com/petrobras-dividendos',
        },
        {
            titulo: 'Copom mantém taxa Selic — reflexo na renda fixa',
            texto: 'A decisão favorece seus títulos atrelados ao CDI na carteira. Vale reforçar a posição em renda fixa neste momento, aproveitando o patamar de juros para garantir rentabilidade previsível na parcela conservadora dos seus investimentos.',
            link: 'https://bcb.gov.br/copom',
        },
    ] as Topico[],
};

function MorningCall() {
    const mc = MORNING_CALL_MOCK;

    return (
        <div className="mc-page">
            <div className="mc-container">
                <div className="mc-reader-header">
                    <div className="mc-reader-tag">
                        <span className="mc-icon-sm">☕</span>
                        <span>MORNING CALL</span>
                    </div>
                    <h1 className="mc-reader-title">{mc.titulo}</h1>
                    <div className="mc-reader-meta">
                        <span>📅 {mc.data}</span>
                        
                    </div>
                </div>

                {mc.topicos.map((topico, index) => (
                    <div className="mc-reader-topico" key={index}>
                        <div className="mc-reader-topico-title">
                            <span className="mc-reader-num">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <span>{topico.titulo}</span>
                        </div>
                        <p className="mc-reader-texto">{topico.texto}</p>
                        <a
                            className="mc-reader-link"
                            href={topico.link}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            🔗 Ler notícia completa
                        </a>
                    </div>
                ))}

                <div className="mc-reader-footer">
                    Morning Call preparado pelo seu gestor · Caddie Research
                </div>
            </div>
        </div>
    );
}

export default MorningCall;
