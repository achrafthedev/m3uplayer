import {
  getLiveCategories,
  getLiveStreams,
  getSeriesCategories,
  getSeriesList,
  getVodCategories,
  getVodStreams,
  xtreamLogin,
} from './xtream'
import { fetchM3U } from './m3u'
import type { Category } from '../types'

export interface CategoryBreakdown {
  section: 'live' | 'vod' | 'series'
  name: string
  count: number
}

export interface XtreamCheckResult {
  mode: 'xtream'
  ok: true
  responseTimeMs: number
  account: {
    status: string
    isTrial: boolean
    expDate: string | null
    createdAt: string | null
    activeConnections: string
    maxConnections: string
    allowedFormats: string[]
  }
  server: {
    url: string
    port: string
    protocol: string
    timezone: string
    serverTimeNow: string
  }
  totals: { live: number; vod: number; series: number }
  breakdown: CategoryBreakdown[]
}

export interface M3UCheckResult {
  mode: 'm3u'
  ok: true
  responseTimeMs: number
  channelCount: number
  groups: { name: string; count: number }[]
}

export interface CheckError {
  ok: false
  message: string
}

function byCategory<T extends { category_id: string }>(
  items: T[],
  categories: Category[],
): { name: string; count: number }[] {
  const nameById = new Map(categories.map((c) => [c.category_id, c.category_name]))
  const counts = new Map<string, number>()
  for (const item of items) {
    counts.set(item.category_id, (counts.get(item.category_id) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([id, count]) => ({ name: nameById.get(id) ?? `Category ${id}`, count }))
    .sort((a, b) => b.count - a.count)
}

export async function checkXtream(
  server: string,
  username: string,
  password: string,
): Promise<XtreamCheckResult | CheckError> {
  const start = performance.now()
  try {
    const auth = await xtreamLogin(server, username, password)
    const responseTimeMs = Math.round(performance.now() - start)

    const [liveCategories, vodCategories, seriesCategories, liveStreams, vodStreams, series] =
      await Promise.all([
        getLiveCategories(server, username, password),
        getVodCategories(server, username, password),
        getSeriesCategories(server, username, password),
        getLiveStreams(server, username, password),
        getVodStreams(server, username, password),
        getSeriesList(server, username, password),
      ])

    const breakdown: CategoryBreakdown[] = [
      ...byCategory(liveStreams, liveCategories).map((b) => ({ ...b, section: 'live' as const })),
      ...byCategory(vodStreams, vodCategories).map((b) => ({ ...b, section: 'vod' as const })),
      ...byCategory(series, seriesCategories).map((b) => ({ ...b, section: 'series' as const })),
    ]

    const info = auth.user_info
    return {
      mode: 'xtream',
      ok: true,
      responseTimeMs,
      account: {
        status: info.status,
        isTrial: info.is_trial === '1',
        expDate: info.exp_date ? new Date(Number(info.exp_date) * 1000).toLocaleString() : null,
        createdAt: info.created_at ? new Date(Number(info.created_at) * 1000).toLocaleString() : null,
        activeConnections: info.active_cons,
        maxConnections: info.max_connections,
        allowedFormats: info.allowed_output_formats ?? [],
      },
      server: {
        url: auth.server_info.url,
        port: auth.server_info.port,
        protocol: auth.server_info.server_protocol,
        timezone: auth.server_info.timezone,
        serverTimeNow: auth.server_info.time_now,
      },
      totals: { live: liveStreams.length, vod: vodStreams.length, series: series.length },
      breakdown,
    }
  } catch (err) {
    return { ok: false, message: (err as Error).message }
  }
}

export async function checkM3U(url: string): Promise<M3UCheckResult | CheckError> {
  const start = performance.now()
  try {
    const { channels } = await fetchM3U(url)
    const responseTimeMs = Math.round(performance.now() - start)
    const counts = new Map<string, number>()
    for (const ch of channels) {
      const key = ch.groupTitle || 'Uncategorized'
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    const groups = [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
    return { mode: 'm3u', ok: true, responseTimeMs, channelCount: channels.length, groups }
  } catch (err) {
    return { ok: false, message: (err as Error).message }
  }
}
