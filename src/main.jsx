import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// Le Pixel Meta est initialisé directement dans index.html (fbq init + PageView base)
// Les événements avancés sont gérés via src/utils/metaPixel.js

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)