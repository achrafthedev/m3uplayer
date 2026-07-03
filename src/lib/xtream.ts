import { withProxy } from './proxy'
import type {
  Category,
  LiveStream,
  SeriesInfoResponse,
  SeriesItem,
  VodStream,
  XtreamAuthResponse,
} from '../types'

export function normalizeServer(server: string): string {
  let s = server.trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(s)) s = 'http://' + s
  return s
}

function apiUrl(
  server: string,
  username: string,
  password: string,
  action?: string,
  params: Record<string, string> = {},
): string {
  const base = normalizeServer(server)
  const search = new URLSearchParams({
    username,
    password,
    ...(action ? { action } : {}),
    ...params,
  })
  return `${base}/player_api.php?${search.toString()}`
}

async function fetchJson<T>(url: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(withProxy(url))
  } catch {
    throw new Error('Network request failed — the server may be unreachable or blocking cross-origin requests (CORS). See README for using a proxy.')
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  const text = await res.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('Server did not return valid JSON — check the server URL, username and password')
  }
}

export async function xtreamLogin(
  server: string,
  username: string,
  password: string,
): Promise<XtreamAuthResponse> {
  const data = await fetchJson<XtreamAuthResponse>(apiUrl(server, username, password))
  if (!data?.user_info || Number(data.user_info.auth) !== 1) {
    throw new Error('Authentication failed — check server address, username and password')
  }
  return data
}

export const getLiveCategories = (server: string, username: string, password: string) =>
  fetchJson<Category[]>(apiUrl(server, username, password, 'get_live_categories')).catch(() => [])

export const getVodCategories = (server: string, username: string, password: string) =>
  fetchJson<Category[]>(apiUrl(server, username, password, 'get_vod_categories')).catch(() => [])

export const getSeriesCategories = (server: string, username: string, password: string) =>
  fetchJson<Category[]>(apiUrl(server, username, password, 'get_series_categories')).catch(() => [])

export const getLiveStreams = (server: string, username: string, password: string) =>
  fetchJson<LiveStream[]>(apiUrl(server, username, password, 'get_live_streams')).catch(() => [])

export const getVodStreams = (server: string, username: string, password: string) =>
  fetchJson<VodStream[]>(apiUrl(server, username, password, 'get_vod_streams')).catch(() => [])

export const getSeriesList = (server: string, username: string, password: string) =>
  fetchJson<SeriesItem[]>(apiUrl(server, username, password, 'get_series')).catch(() => [])

export const getSeriesInfo = (
  server: string,
  username: string,
  password: string,
  seriesId: number,
) =>
  fetchJson<SeriesInfoResponse>(
    apiUrl(server, username, password, 'get_series_info', { series_id: String(seriesId) }),
  )

export function buildLiveStreamUrl(
  server: string,
  username: string,
  password: string,
  streamId: number,
  ext: 'ts' | 'm3u8' = 'ts',
): string {
  return `${normalizeServer(server)}/live/${username}/${password}/${streamId}.${ext}`
}

export function buildVodStreamUrl(
  server: string,
  username: string,
  password: string,
  streamId: number,
  ext: string,
): string {
  return `${normalizeServer(server)}/movie/${username}/${password}/${streamId}.${ext}`
}

export function buildSeriesStreamUrl(
  server: string,
  username: string,
  password: string,
  episodeId: string,
  ext: string,
): string {
  return `${normalizeServer(server)}/series/${username}/${password}/${episodeId}.${ext}`
}

export function buildM3uPlaylistUrl(
  server: string,
  username: string,
  password: string,
  output: 'ts' | 'mpegts' | 'hls' = 'ts',
): string {
  const base = normalizeServer(server)
  const search = new URLSearchParams({
    username,
    password,
    type: 'm3u_plus',
    output,
  })
  return `${base}/get.php?${search.toString()}`
}

/** Parses a pasted get.php / player_api.php / xtream link into server+credentials. */
export function parseXtreamLink(
  input: string,
): { server: string; username: string; password: string } | null {
  try {
    const trimmed = input.trim()
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`
    const u = new URL(withProtocol)
    const username = u.searchParams.get('username')
    const password = u.searchParams.get('password')
    if (!username || !password) return null
    return { server: `${u.protocol}//${u.host}`, username, password }
  } catch {
    return null
  }
}
