import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.DEV ? '' : 'https://caddieresearch-api-gnewb5eebrckadfk.brazilsouth-01.azurewebsites.net',
});

export default api;
