import { useSettingsStore } from '../store/settingsStore'

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const corsProxy = useSettingsStore((s) => s.corsProxy)
  const setCorsProxy = useSettingsStore((s) => s.setCorsProxy)
  const liveOutputFormat = useSettingsStore((s) => s.liveOutputFormat)
  const setLiveOutputFormat = useSettingsStore((s) => s.setLiveOutputFormat)

  return (
    <div className="settings-panel">
      <h3>Settings</h3>

      <div className="field">
        <label htmlFor="cors-proxy">CORS proxy (optional)</label>
        <input
          id="cors-proxy"
          type="text"
          placeholder="https://your-proxy.example.com/"
          value={corsProxy}
          onChange={(e) => setCorsProxy(e.target.value)}
        />
        <div className="hint">
          If your provider blocks cross-origin requests, requests will be routed through this prefix. Use{' '}
          <code>{'{url}'}</code> as a placeholder if your proxy needs a query param instead of a path prefix. See README.
        </div>
      </div>

      <div className="field">
        <label htmlFor="live-format">Live stream format</label>
        <select id="live-format" value={liveOutputFormat} onChange={(e) => setLiveOutputFormat(e.target.value as 'ts' | 'm3u8')}>
          <option value="ts">MPEG-TS (ts)</option>
          <option value="m3u8">HLS (m3u8)</option>
        </select>
        <div className="hint">Some providers only support one of these for live channels.</div>
      </div>

      <div className="form-actions">
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
