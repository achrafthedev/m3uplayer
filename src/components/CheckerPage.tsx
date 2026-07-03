import { useState } from 'react'
import type { FormEvent } from 'react'
import { checkM3U, checkXtream, type CategoryBreakdown, type M3UCheckResult, type XtreamCheckResult } from '../lib/checker'
import { parseXtreamLink } from '../lib/xtream'

type Result = XtreamCheckResult | M3UCheckResult | { ok: false; message: string } | null

export function CheckerPage() {
  const [tab, setTab] = useState<'xtream' | 'm3u'>('xtream')
  const [manual, setManual] = useState(false)
  const [link, setLink] = useState('')
  const [server, setServer] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [m3uUrl, setM3uUrl] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<Result>(null)

  async function handleXtreamCheck(e: FormEvent) {
    e.preventDefault()
    const creds = manual
      ? server && username && password
        ? { server, username, password }
        : null
      : parseXtreamLink(link)

    if (!creds) {
      setResult({ ok: false, message: manual ? 'Please fill in server, username and password' : "Couldn't parse that link" })
      return
    }

    setChecking(true)
    setResult(null)
    const res = await checkXtream(creds.server, creds.username, creds.password)
    setResult(res)
    setChecking(false)
  }

  async function handleM3UCheck(e: FormEvent) {
    e.preventDefault()
    if (!m3uUrl.trim()) {
      setResult({ ok: false, message: 'Please enter a playlist URL' })
      return
    }
    setChecking(true)
    setResult(null)
    const res = await checkM3U(m3uUrl.trim())
    setResult(res)
    setChecking(false)
  }

  return (
    <div className="checker-page">
      <h1>Link Checker</h1>
      <p className="subtitle">Validate an Xtream login or M3U playlist URL and see what's inside it.</p>

      <div className="connect-card">
        <div className="connect-tabs">
          <button type="button" className={tab === 'xtream' ? 'active' : ''} onClick={() => setTab('xtream')}>
            Xtream Codes
          </button>
          <button type="button" className={tab === 'm3u' ? 'active' : ''} onClick={() => setTab('m3u')}>
            M3U Playlist URL
          </button>
        </div>

        {tab === 'xtream' ? (
          <form onSubmit={handleXtreamCheck}>
            {!manual ? (
              <div className="field">
                <label htmlFor="check-link">Xtream link (get.php or player_api.php URL)</label>
                <input
                  id="check-link"
                  type="text"
                  placeholder="http://host:port/get.php?username=...&password=...&type=m3u_plus&output=mpegts"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
                <div className="hint">
                  <button type="button" className="toggle-link" onClick={() => setManual(true)}>
                    Enter server/username/password manually instead
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="check-server">Server URL</label>
                  <input id="check-server" type="text" placeholder="http://host:port" value={server} onChange={(e) => setServer(e.target.value)} />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="check-username">Username</label>
                    <input id="check-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="check-password">Password</label>
                    <input id="check-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
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
              <button type="submit" className="primary" disabled={checking}>
                {checking ? 'Checking…' : 'Check'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleM3UCheck}>
            <div className="field">
              <label htmlFor="check-m3u">Playlist URL</label>
              <input id="check-m3u" type="text" placeholder="http://host/playlist.m3u" value={m3uUrl} onChange={(e) => setM3uUrl(e.target.value)} />
            </div>
            <div className="form-actions">
              <button type="submit" className="primary" disabled={checking}>
                {checking ? 'Checking…' : 'Check'}
              </button>
            </div>
          </form>
        )}
      </div>

      {result && <CheckerResultView result={result} />}
    </div>
  )
}

function CheckerResultView({ result }: { result: NonNullable<Result> }) {
  if (!result.ok) {
    return (
      <div className="checker-result fail">
        <span className="status-pill fail">FAILED</span>
        <p>{result.message}</p>
      </div>
    )
  }

  if (result.mode === 'xtream') {
    return (
      <div className="checker-result ok">
        <span className="status-pill ok">VALID</span>
        <span style={{ marginLeft: '0.6rem', color: 'var(--text-dim)' }}>responded in {result.responseTimeMs} ms</span>

        <div className="stat-grid">
          <Stat label="Account status" value={result.account.status} />
          <Stat label="Trial" value={result.account.isTrial ? 'Yes' : 'No'} />
          <Stat label="Expires" value={result.account.expDate ?? 'Never'} />
          <Stat label="Created" value={result.account.createdAt ?? '—'} />
          <Stat label="Connections" value={`${result.account.activeConnections} / ${result.account.maxConnections}`} />
          <Stat label="Formats" value={result.account.allowedFormats.join(', ') || '—'} />
        </div>

        <div className="stat-grid">
          <Stat label="Live channels" value={String(result.totals.live)} />
          <Stat label="Movies" value={String(result.totals.vod)} />
          <Stat label="Series" value={String(result.totals.series)} />
        </div>

        <BreakdownTable breakdown={result.breakdown} />
      </div>
    )
  }

  return (
    <div className="checker-result ok">
      <span className="status-pill ok">VALID</span>
      <span style={{ marginLeft: '0.6rem', color: 'var(--text-dim)' }}>responded in {result.responseTimeMs} ms</span>

      <div className="stat-grid">
        <Stat label="Channels" value={String(result.channelCount)} />
        <Stat label="Groups" value={String(result.groups.length)} />
      </div>

      <table className="breakdown-table">
        <thead>
          <tr>
            <th>Group</th>
            <th>Channels</th>
          </tr>
        </thead>
        <tbody>
          {result.groups.map((g) => (
            <tr key={g.name}>
              <td>{g.name}</td>
              <td>{g.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-tile">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  )
}

function BreakdownTable({ breakdown }: { breakdown: CategoryBreakdown[] }) {
  if (breakdown.length === 0) return null
  return (
    <table className="breakdown-table">
      <thead>
        <tr>
          <th>Section</th>
          <th>Category</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        {breakdown.map((b, i) => (
          <tr key={`${b.section}-${b.name}-${i}`}>
            <td className="section-badge">{b.section}</td>
            <td>{b.name}</td>
            <td>{b.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
