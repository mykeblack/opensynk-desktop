import React from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>OpenSynk Desktop</h1>
      <p>Solar, battery, and grid monitoring dashboard.</p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
