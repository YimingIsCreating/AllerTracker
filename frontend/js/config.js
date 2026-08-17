const isLocal = location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';

const CONFIG = {
    API_URL: isLocal ? 'http://127.0.0.1:8000' : 'https://allertracker-api.onrender.com'
};