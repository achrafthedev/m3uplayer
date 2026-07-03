import { useState } from 'react'
import './App.css'
import { useConnectionStore } from './store/connectionStore'
import { ConnectionScreen } from './components/ConnectionScreen'
import { PlayerPage } from './components/PlayerPage'
import { CheckerPage } from './components/CheckerPage'
import { SettingsPanel } from './components/SettingsPanel'

type Tab = 'player' | 'checker'

function App() {
  const [tab, setTab] = useState<Tab>('player')
  const [showSettings, setShowSettings] = useState(false)
  const mode = useConnectionStore((s) => s.mode)
  const xtream = useConnectionStore((s) => s.xtream)
  const disconnect = useConnectionStore((s) => s.disconnect)

  return (
    <div className="app-shell">
      <div className="top-nav">
        <span className="brand">IPTV Player</span>
        <div className="nav-tabs">
          <button className={tab === 'player' ? 'active' : ''} onClick={() => setTab('player')}>
            Player
          </button>
          <button className={tab === 'checker' ? 'active' : ''} onClick={() => setTab('checker')}>
            Checker
          </button>
        </div>
        <div className="spacer" />
        {mode && (
          <>
            <span className="conn-status">{mode === 'xtream' ? xtream?.server : 'M3U playlist'}</span>
            <button onClick={disconnect}>Disconnect</button>
          </>
        )}
        <button onClick={() => setShowSettings((v) => !v)}>Settings</button>
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      </div>

      <div className="main-content">
        {tab === 'player' ? mode ? <PlayerPage /> : <ConnectionScreen /> : <CheckerPage />}
      </div>
    </div>
  )
}

export default App
