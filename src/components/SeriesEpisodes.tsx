import { useMemo, useState } from 'react'
import { useAsync } from '../hooks/useAsync'
import { getSeriesInfo } from '../lib/xtream'
import type { SeriesEpisode, XtreamCredentials } from '../types'

interface SeriesEpisodesProps {
  credentials: XtreamCredentials
  seriesId: number
  seriesName: string
  activeEpisodeId: string | null
  onSelectEpisode: (episode: SeriesEpisode) => void
}

export function SeriesEpisodes({ credentials, seriesId, seriesName, activeEpisodeId, onSelectEpisode }: SeriesEpisodesProps) {
  const { server, username, password } = credentials
  const key = `series-info:${server}:${username}:${seriesId}`
  const { data, loading, error } = useAsync(key, () => getSeriesInfo(server, username, password, seriesId))
  const [season, setSeason] = useState<string | null>(null)

  const seasons = useMemo(() => (data ? Object.keys(data.episodes) : []), [data])
  const activeSeason = season ?? seasons[0] ?? null
  const episodes = activeSeason ? data?.episodes[activeSeason] ?? [] : []

  if (loading) return <div className="loading-state">Loading episodes…</div>
  if (error) return <div className="error-state">{error}</div>
  if (!data) return null

  return (
    <div className="episodes-panel">
      <h3>{seriesName}</h3>
      {seasons.length > 1 && (
        <select className="season-select" value={activeSeason ?? ''} onChange={(e) => setSeason(e.target.value)}>
          {seasons.map((s) => (
            <option key={s} value={s}>
              Season {s}
            </option>
          ))}
        </select>
      )}
      {episodes.map((ep) => (
        <div
          key={ep.id}
          className={`episode-item${ep.id === activeEpisodeId ? ' active' : ''}`}
          onClick={() => onSelectEpisode(ep)}
        >
          <span>
            E{ep.episode_num} · {ep.title}
          </span>
        </div>
      ))}
      {episodes.length === 0 && <div className="empty-state">No episodes found</div>}
    </div>
  )
}
