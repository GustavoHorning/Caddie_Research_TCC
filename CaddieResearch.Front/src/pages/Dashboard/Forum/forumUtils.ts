export interface ForumAutor {
    nome: string;
    tipoPerfil: string;
    fotoPerfilUrl: string | null;
}

export const STATUS_LABEL: Record<string, string> = {
    Pendente: 'Aguardando aprovação',
    Publicado: 'Publicado',
    Recusado: 'Recusado',
};

export function formatarData(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-BR');
}

export function formatarDataHora(iso: string): string {
    const d = new Date(iso);
    return `${d.toLocaleDateString('pt-BR')}, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

export function formatarTamanho(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function mensagemErro(error: unknown, padrao: string): string {
    return (error as { response?: { data?: { erro?: string } } }).response?.data?.erro || padrao;
}
