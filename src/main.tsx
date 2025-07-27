import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './global.css'
import App from './App.tsx'
import { ProjectProvider } from './context/ProjectContext.tsx'
import { InkProvider } from './context/InkContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProjectProvider>
      <InkProvider>
        <App />
      </InkProvider>
    </ProjectProvider>

  </StrictMode>,
)
