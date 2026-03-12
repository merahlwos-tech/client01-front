import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ensureFbp, getFbc } from './utils/metaPixel'

// ── Meta Pixel — initialisation des cookies au chargement ──────────────────
// 1. ensureFbp() : génère _fbp manuellement si le Pixel est bloqué
//    par le navigateur (Firefox, Brave, Safari ITP…)
// 2. getFbc()    : capture fbclid depuis l'URL si l'user vient d'une pub
//    et le persiste en localStorage pour les visites suivantes
ensureFbp()
getFbc()
// ───────────────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)