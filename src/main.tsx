import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// No StrictMode: it double-invokes effects in dev, which briefly opens two
// concurrent connections to the live stream — many IPTV accounts allow only
// one (max_connections: 1) and reject the second, breaking playback.
createRoot(document.getElementById('root')!).render(<App />)
