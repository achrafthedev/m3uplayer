export type ConnectionMode = 'xtream' | 'm3u'

export interface XtreamCredentials {
  server: string
  username: string
  password: string
}

export interface XtreamUserInfo {
  username: string
  password: string
  auth: number
  status: string
  exp_date: string | null
  is_trial: string
  active_cons: string
  created_at: string | null
  max_connections: string
  allowed_output_formats?: string[]
}

export interface XtreamServerInfo {
  url: string
  port: string
  https_port?: string
  server_protocol: string
  timezone: string
  timestamp_now: number
  time_now: string
}

export interface XtreamAuthResponse {
  user_info: XtreamUserInfo
  server_info: XtreamServerInfo
}

export interface Category {
  category_id: string
  category_name: string
  parent_id: number
}

export interface LiveStream {
  num: number
  name: string
  stream_type: string
  stream_id: number
  stream_icon?: string
  epg_channel_id?: string | null
  category_id: string
  tv_archive?: number
}

export interface VodStream {
  num: number
  name: string
  stream_type: string
  stream_id: number
  stream_icon?: string
  category_id: string
  container_extension?: string
  rating?: string
}

export interface SeriesItem {
  num: number
  name: string
  series_id: number
  cover?: string
  category_id: string
  plot?: string
  rating?: string
}

export interface SeriesEpisode {
  id: string
  episode_num: number
  title: string
  container_extension: string
  season: number
}

export interface SeriesInfoSeason {
  season_number: number
  name?: string
}

export interface SeriesInfoResponse {
  seasons?: SeriesInfoSeason[]
  info?: { name?: string; plot?: string; cover?: string }
  episodes: Record<string, SeriesEpisode[]>
}

export interface M3UChannel {
  name: string
  url: string
  logo?: string
  groupTitle?: string
  tvgId?: string
}

export type PlayerKind = 'live' | 'vod' | 'episode' | 'm3u'

export interface NowPlaying {
  kind: PlayerKind
  name: string
  url: string
  logo?: string
}
