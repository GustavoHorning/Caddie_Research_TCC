import axios from 'axios';

// Em desenvolvimento fica vazio: as chamadas /api passam pelo proxy do Vite até o backend local
export const API_URL = import.meta.env.DEV ? '' : 'https://caddieresearch-api-gnewb5eebrckadfk.brazilsouth-01.azurewebsites.net';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(async config => {
    const token = localStorage.getItem('caddie_token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;