import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useConnectionStore } from '../store/connectionStore'
import { useLibraryStore } from '../store/libraryStore'
import { useSettingsStore } from '../store/settingsStore'
import { CategoryList } from './CategoryList'
import { ChannelList } from './ChannelList'
import { SeriesEpisodes } from './SeriesEpisodes'
import { buildLiveStreamUrl, buildSeriesStreamUrl, buildVodStreamUrl } from '../lib/xtream'
import type { NowPlaying, SeriesEpisode } from '../types'

const VideoPlayer = lazy(() => import('./VideoPlayer').then((m) => ({ default: m.VideoPlayer })))

type Section = 'live' | 'vod' | 'series'

export function PlayerPage() {
  const { mode, xtream, m3uUrl } = useConnectionStore()
  const disconnect = useConnectionStore((s) => s.disconnect)
  const { status, error, liveCategories, vodCategories, seriesCategories, liveStreams, vodStreams, series, m3uChannels } =
    useLibraryStore()
  const loadXtream = useLibraryStore((s) => s.loadXtream)
  const loadM3U = useLibraryStore((s) => s.loadM3U)
  const reset = useLibraryStore((s) => s.reset)
  const liveOutputFormat = useSettingsStore((s) => s.liveOutputFormat)

  const [section, setSection] = useState<Section>('live')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null)
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null)

  useEffect(() => {
    if (mode === 'xtream' && xtream) void loadXtream(xtream)
    else if (mode === 'm3u' && m3uUrl) void loadM3U(m3uUrl)
    return () => reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, xtream?.server, xtream?.username, m3uUrl])

  useEffect(() => {
    setActiveCategory('all')
    setSearch('')
    setSelectedSeriesId(null)
  }, [section])

  const categories = useMemo(() => {
    const raw = section === 'live' ? liveCategories : section === 'vod' ? vodCategories : seriesCategories
    const items = section === 'live' ? liveStreams : section === 'vod' ? vodStreams : series
    const total = items.length
    return [
      { id: 'all', name: 'All', count: total },
      ...raw.map((c) => ({
        id: c.category_id,
        name: c.category_name,
        count: items.filter((i) => i.category_id === c.category_id).length,
      })),
    ]
  }, [section, liveCategories, vodCategories, seriesCategories, liveStreams, vodStreams, series])

  const m3uGroups = useMemo(() => {
    const map = new Map<string, number>()
    for (const ch of m3uChannels) {
      const g = ch.groupTitle || 'Uncategorized'
      map.set(g, (map.get(g) ?? 0) + 1)
    }
    return [
      { id: 'all', name: 'All', count: m3uChannels.length },
      ...[...map.entries()].map(([name, count]) => ({ id: name, name, count })).sort((a, b) => a.name.localeCompare(b.name)),
    ]
  }, [m3uChannels])

  const m3uFiltered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return m3uChannels
      .map((ch, idx) => ({ ...ch, id: String(idx) }))
      .filter((ch) => activeCategory === 'all' || (ch.groupTitle || 'Uncategorized') === activeCategory)
      .filter((ch) => !q || ch.name.toLowerCase().includes(q))
  }, [activeCategory, search, m3uChannels])

  const liveFiltered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return liveStreams
      .filter((i) => activeCategory === 'all' || i.category_id === activeCategory)
      .filter((i) => !q || i.name.toLowerCase().includes(q))
  }, [activeCategory, search, liveStreams])

  const vodFiltered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return vodStreams
      .filter((i) => activeCategory === 'all' || i.category_id === activeCategory)
      .filter((i) => !q || i.name.toLowerCase().includes(q))
  }, [activeCategory, search, vodStreams])

  const seriesFiltered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return series
      .filter((i) => activeCategory === 'all' || i.category_id === activeCategory)
      .filter((i) => !q || i.name.toLowerCase().includes(q))
  }, [activeCategory, search, series])

  if (status === 'loading' || status === 'idle') {
    return <div className="loading-state">Loading your library…</div>
  }
  if (status === 'error') {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    )
  }

  function playLive(item: (typeof liveStreams)[number]) {
    if (!xtream) return
    const url = buildLiveStreamUrl(xtream.server, xtream.username, xtream.password, item.stream_id, liveOutputFormat)
    setNowPlaying({ kind: 'live', name: item.name, url, logo: item.stream_icon })
    setSelectedSeriesId(null)
  }

  function playVod(item: (typeof vodStreams)[number]) {
    if (!xtream) return
    const url = buildVodStreamUrl(xtream.server, xtream.username, xtream.password, item.stream_id, item.container_extension || 'mp4')
    setNowPlaying({ kind: 'vod', name: item.name, url, logo: item.stream_icon })
    setSelectedSeriesId(null)
  }

  function playEpisode(seriesName: string, episode: SeriesEpisode) {
    if (!xtream) return
    const url = buildSeriesStreamUrl(xtream.server, xtream.username, xtream.password, episode.id, episode.container_extension || 'mp4')
    setNowPlaying({ kind: 'episode', name: `${seriesName} — E${episode.episode_num} ${episode.title}`, url })
  }

  function playM3U(channel: { name: string; url: string; logo?: string }) {
    setNowPlaying({ kind: 'm3u', name: channel.name, url: channel.url, logo: channel.logo })
  }

  function handleSelect(id: string) {
    if (mode === 'm3u') {
      const ch = m3uFiltered.find((c) => c.id === id)
      if (ch) playM3U(ch)
      return
    }
    if (section === 'live') {
      const item = liveStreams.find((s) => String(s.stream_id) === id)
      if (item) playLive(item)
    } else if (section === 'vod') {
      const item = vodStreams.find((s) => String(s.stream_id) === id)
      if (item) playVod(item)
    } else {
      const item = series.find((s) => String(s.series_id) === id)
      if (item) setSelectedSeriesId(item.series_id)
    }
  }

  const listEntries =
    mode === 'm3u'
      ? m3uFiltered.map((ch) => ({ id: ch.id, name: ch.name, logo: ch.logo }))
      : section === 'series'
        ? seriesFiltered.map((s) => ({ id: String(s.series_id), name: s.name, logo: s.cover }))
        : section === 'vod'
          ? vodFiltered.map((s) => ({ id: String(s.stream_id), name: s.name, logo: s.stream_icon }))
          : liveFiltered.map((s) => ({ id: String(s.stream_id), name: s.name, logo: s.stream_icon }))

  const activeId =
    section === 'series' && selectedSeriesId
      ? String(selectedSeriesId)
      : nowPlaying && mode === 'm3u'
        ? m3uFiltered.find((c) => c.url === nowPlaying.url)?.id ?? null
        : null

  const selectedSeries = selectedSeriesId ? series.find((s) => s.series_id === selectedSeriesId) : null

  return (
    <div className="player-page">
      <div className="categories-pane">
        <div className="pane-header">
          <strong>{mode === 'm3u' ? 'Groups' : 'Categories'}</strong>
        </div>
        {mode === 'xtream' && (
          <div className="section-tabs">
            <button className={section === 'live' ? 'active' : ''} onClick={() => setSection('live')}>
              Live
            </button>
            <button className={section === 'vod' ? 'active' : ''} onClick={() => setSection('vod')}>
              Movies
            </button>
            <button className={section === 'series' ? 'active' : ''} onClick={() => setSection('series')}>
              Series
            </button>
          </div>
        )}
        <CategoryList
          categories={mode === 'm3u' ? m3uGroups : categories}
          activeId={activeCategory}
          onSelect={setActiveCategory}
        />
      </div>

      <div className="channels-pane">
        <div className="search-box">
          <input
            type="search"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ChannelList items={listEntries} activeId={activeId} onSelect={handleSelect} />
      </div>

      <div className="player-pane">
        {nowPlaying && (
          <>
            <Suspense fallback={<div className="loading-state">Loading player…</div>}>
              <VideoPlayer src={nowPlaying.url} />
            </Suspense>
            <div className="now-playing">
              <div className="title">{nowPlaying.name}</div>
            </div>
          </>
        )}
        {section === 'series' && selectedSeries && xtream && (
          <SeriesEpisodes
            credentials={xtream}
            seriesId={selectedSeries.series_id}
            seriesName={selectedSeries.name}
            activeEpisodeId={null}
            onSelectEpisode={(ep) => playEpisode(selectedSeries.name, ep)}
          />
        )}
        {!nowPlaying && !(section === 'series' && selectedSeries) && (
          <div className="empty-state">Select something to play</div>
        )}
      </div>
    </div>
  )
}
