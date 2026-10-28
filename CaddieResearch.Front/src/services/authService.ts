import api from './api';

export interface UsuarioPerfil {
    tipoPerfil: string;
    plano: string | null;
}

export const authService = {
    async getMeuPerfil(): Promise<UsuarioPerfil> {
        const token = localStorage.getItem('caddie_token');
        const res = await api.get('/api/usuario/meu-perfil', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    }
};