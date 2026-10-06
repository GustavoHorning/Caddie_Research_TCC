import { useRef, useState } from 'react';

function formatarTempo(segundos: number): string {
    if (!isFinite(segundos)) return '0:00';
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min}:${String(seg).padStart(2, '0')}`;
}

function PlayerAudio({ url, titulo = 'Ouça o áudio do Morning Call' }: { url: string; titulo?: string }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [tocando, setTocando] = useState(false);
    const [tempoAtual, setTempoAtual] = useState(0);
    const [duracao, setDuracao] = useState(0);
    const [erro, setErro] = useState(false);

    function alternar() {
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.paused) {
            // Só um áudio toca por vez na página
            document.querySelectorAll('audio').forEach(a => { if (a !== audio) a.pause(); });
            audio.play().catch(() => setErro(true));
        } else {
            audio.pause();
        }
    }

    function irPara(event: React.MouseEvent<HTMLDivElement>) {
        const audio = audioRef.current;
        if (!audio || !duracao) return;
        const area = event.currentTarget.getBoundingClientRect();
        audio.currentTime = ((event.clientX - area.left) / area.width) * duracao;
    }

    const progresso = duracao > 0 ? (tempoAtual / duracao) * 100 : 0;

    return (
        <div className="mc-player">
            <button
                type="button"
                className="mc-player-btn"
                onClick={alternar}
                disabled={erro}
                aria-label={tocando ? 'Pausar áudio' : 'Ouvir áudio'}
            >
                {tocando ? '⏸' : '▶'}
            </button>
            <div className="mc-player-corpo">
                <span className="mc-player-titulo">
                    🎧 {erro ? 'Áudio indisponível no momento' : titulo}
                </span>
                <div className="mc-player-linha">
                    <div className="mc-player-barra" onClick={irPara}>
                        <div className="mc-player-barra-fill" style={{ width: `${progresso}%` }} />
                    </div>
                    <span className="mc-player-tempo">
                        {formatarTempo(tempoAtual)} / {formatarTempo(duracao)}
                    </span>
                </div>
            </div>
            <audio
                ref={audioRef}
                src={url}
                preload="metadata"
                onPlay={() => setTocando(true)}
                onPause={() => setTocando(false)}
                onEnded={() => { setTocando(false); setTempoAtual(0); }}
                onTimeUpdate={e => setTempoAtual(e.currentTarget.currentTime)}
                onLoadedMetadata={e => setDuracao(e.currentTarget.duration)}
                onError={() => setErro(true)}
            />
        </div>
    );
}

export default PlayerAudio;
