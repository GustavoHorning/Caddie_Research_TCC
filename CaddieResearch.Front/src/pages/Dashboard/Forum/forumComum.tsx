import type { ForumAutor } from './forumUtils';

export function Avatar({ autor }: { autor: ForumAutor }) {
    if (autor.fotoPerfilUrl) {
        return <img className="fr-avatar" src={autor.fotoPerfilUrl} alt="" />;
    }
    return <div className="fr-avatar">{(autor.nome || '?').charAt(0).toUpperCase()}</div>;
}

export function AutorInfo({ autor, data }: { autor: ForumAutor; data: string }) {
    const ehGestor = autor.tipoPerfil === 'Gestor';
    return (
        <div className="fr-autor">
            <Avatar autor={autor} />
            <div>
                <div className="fr-autor-nome">
                    {autor.nome}
                    {ehGestor && <span className="fr-selo-gestor">Gestor Caddie Research</span>}
                </div>
                <div className="fr-autor-sub">
                    {ehGestor ? 'Gestor' : 'Membro'} • {data}
                </div>
            </div>
        </div>
    );
}

export function IconeCurtir() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
    );
}

export function IconeResposta() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}
