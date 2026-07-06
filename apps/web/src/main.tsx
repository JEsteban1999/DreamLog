import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './store/ui.store.ts' // aplica la clase .dark antes de renderizar cualquier página
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// Registrar el service worker en producción (PWA instalable + offline + push).
// En dev se omite para no interferir con el HMR de Vite; ahí el SW se registra
// on-demand al activar las notificaciones push.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Si falla el registro, la app sigue funcionando sin PWA/offline.
    })
  })
}
