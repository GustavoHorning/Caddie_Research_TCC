import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5194/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('caddie_token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;