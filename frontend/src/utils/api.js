import axios from 'axios'

const api = axios.create({
  baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 5000,
})

export default api
