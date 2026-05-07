import axios from 'axios';

const ambienteVite = import.meta.env.VITE_API_URL;
const urlAzure = 'https://caddieresearch-api-gnewb5eebrckadfk.brazilsouth-01.azurewebsites.net';

// A Mágica do Plano B: Se o ambienteVite for 'undefined', ele assume a urlAzure automaticamente.
const urlMestre = ambienteVite || urlAzure;

console.log("A URL FINAL ESCOLHIDA FOI:", urlMestre);

const api = axios.create({
    baseURL: urlMestre,
});

export default api;