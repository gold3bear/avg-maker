import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './global.css'
import App from './App.tsx'
import PreviewWindow from './PreviewWindow'
import { ProjectProvider } from './context/ProjectContext.tsx'
import { InkProvider } from './context/InkContext.tsx'

// 在开发环境下让React全局可用，这样DevTools能检测到
if (process.env.NODE_ENV === 'development') {
  (window as any).React = React;
  console.log('🔧 React made globally available for DevTools');
}

const params = new URLSearchParams(window.location.search)
const mode = params.get('mode')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProjectProvider>
      <InkProvider>
        {mode === 'preview' ? <PreviewWindow /> : <App />}
      </InkProvider>
    </ProjectProvider>
  </StrictMode>,
)
