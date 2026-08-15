// src/utils/staffApi.js
// Instance Axios dédiée à la plateforme interne (atelier).
// Token séparé de l'admin e-commerce ('staffToken' ≠ 'adminToken') pour que
// les deux sessions coexistent sans interférence.

import axios from 'axios'

const staffApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Ajoute le token JWT staff à chaque requête
staffApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('staffToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Déconnexion auto sur 401 (token expiré/invalide)
staffApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('staffToken')
      if (window.location.pathname.startsWith('/staff') &&
          window.location.pathname !== '/staff/login') {
        window.location.href = '/staff/login'
      }
    }
    return Promise.reject(error)
  }
)

export default staffApi
