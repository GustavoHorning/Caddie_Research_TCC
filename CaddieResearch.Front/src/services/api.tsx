import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.DEV ? '' : 'https://caddieresearch-api-gnewb5eebrckadfk.brazilsouth-01.azurewebsites.net',
});

api.interceptors.request.use(async config => {
    const token = localStorage.getItem('caddie_token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;