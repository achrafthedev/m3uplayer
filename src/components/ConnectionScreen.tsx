import { useState } from 'react'
import type { FormEvent } from 'react'
import { useConnectionStore } from '../store/connectionStore'
import { parseXtreamLink, xtreamLogin } from '../lib/xtream'
import { fetchM3U } from '../lib/m3u'

export function ConnectionScreen() {
  const connectXtream = useConnectionStore((s) => s.connectXtream)
  const connectM3U = useConnectionStore((s) => s.connectM3U)

  const [tab, setTab] = useState<'xtream' | 'm3u'>('xtream')
  const [manual, setManual] = useState(false)
  const [link, setLink] = useState('')
  const [server, setServer] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [m3uUrl, setM3uUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleXtreamSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const creds = manual
      ? server && username && password
        ? { server, username, password }
        : null
      : parseXtreamLink(link)

    if (!creds) {
      setError(
        manual
          ? 'Please fill in server, username and password'
          : "Couldn't parse that link — make sure it includes username= and password= (e.g. a get.php or player_api.php URL), or switch to manual entry",
      )
      return
    }

    setSubmitting(true)
    try {
      await xtreamLogin(creds.server, creds.username, creds.password)
      connectXtream(creds)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleM3USubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!m3uUrl.trim()) {
      setError('Please enter a playlist URL')
      return
    }
    setSubmitting(true)
    try {
      await fetchM3U(m3uUrl.trim())
      connectM3U(m3uUrl.trim())
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="connect-screen">
      <h1>Connect to your IPTV service</h1>
      <p className="subtitle">Nothing is sent anywhere except directly to your provider — credentials stay in your browser.</p>

      <div className="connect-card">
        <div className="connect-tabs">
          <button type="button" className={tab === 'xtream' ? 'active' : ''} onClick={() => setTab('xtream')}>
            Xtream Codes
          </button>
          <button type="button" className={tab === 'm3u' ? 'active' : ''} onClick={() => setTab('m3u')}>
            M3U Playlist URL
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        {tab === 'xtream' ? (
          <form onSubmit={handleXtreamSubmit}>
            {!manual ? (
              <div className="field">
                <label htmlFor="link">Xtream link (get.php or player_api.php URL)</label>
                <input
                  id="link"
                  type="text"
                  placeholder="http://host:port/get.php?username=...&password=...&type=m3u_plus&output=mpegts"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
                <div className="hint">
                  Paste the full link your provider gave you.{' '}
                  <button type="button" className="toggle-link" onClick={() => setManual(true)}>
                    Enter server/username/password manually instead
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="server">Server URL</label>
                  <input
                    id="server"
                    type="text"
                    placeholder="http://host:port"
                    value={server}
                    onChange={(e) => setServer(e.target.value)}
                  />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="username">Username</label>
                    <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="password">Password</label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="hint">
                  <button type="button" className="toggle-link" onClick={() => setManual(false)}>
                    Paste a link instead
                  </button>
                </div>
              </>
            )}
            <div className="form-actions">
              <button type="submit" className="primary" disabled={submitting}>
                {submitting ? 'Connecting…' : 'Connect'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleM3USubmit}>
            <div className="field">
              <label htmlFor="m3uUrl">Playlist URL</label>
              <input
                id="m3uUrl"
                type="text"
                placeholder="http://host/playlist.m3u"
                value={m3uUrl}
                onChange={(e) => setM3uUrl(e.target.value)}
              />
              <div className="hint">Any standard M3U/M3U8 playlist URL with #EXTINF entries.</div>
            </div>
            <div className="form-actions">
              <button type="submit" className="primary" disabled={submitting}>
                {submitting ? 'Loading…' : 'Load playlist'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
