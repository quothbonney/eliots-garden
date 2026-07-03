import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Regular weight only — italics and light/medium are browser-synthesized,
// matching the site's original look (adding the real faces changed it)
import '@fontsource/literata/400.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
