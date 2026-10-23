import api from './api';

export interface AtivoCarteira {
    vies: 'Comprar' | 'Aguardar';
}

export interface CarteiraApi {
    id: number;
    nome: string;
    ativos?: AtivoCarteira[];
}

export const carteirasService = {
    async getCarteirasAutorizadas(): Promise<CarteiraApi[]> {
        const token = localStorage.getItem('caddie_token');
        const res = await api.get('/api/carteiras', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    }
};