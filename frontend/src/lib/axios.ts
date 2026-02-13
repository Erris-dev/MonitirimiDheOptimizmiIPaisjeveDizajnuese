import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost/api', // Your Go Backend URL
  withCredentials: true,             // Required to send/receive HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;