import axios from 'axios';

const urlLocal = 'http://localhost:5194';
const urlAzure = 'https://caddieresearch-api-gnewb5eebrckadfk.brazilsouth-01.azurewebsites.net';


const urlMestre = import.meta.env.DEV ? urlLocal : urlAzure;

const api = axios.create({
    baseURL: urlMestre,
});

export default api;