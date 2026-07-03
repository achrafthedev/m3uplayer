import { create } from 'zustand'
import type { Category, LiveStream, M3UChannel, SeriesItem, VodStream, XtreamCredentials } from '../types'
import {
  getLiveCategories,
  getLiveStreams,
  getSeriesCategories,
  getSeriesList,
  getVodCategories,
  getVodStreams,
} from '../lib/xtream'
import { fetchM3U } from '../lib/m3u'

interface LibraryState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  liveCategories: Category[]
  vodCategories: Category[]
  seriesCategories: Category[]
  liveStreams: LiveStream[]
  vodStreams: VodStream[]
  series: SeriesItem[]
  m3uChannels: M3UChannel[]
  loadXtream: (creds: XtreamCredentials) => Promise<void>
  loadM3U: (url: string) => Promise<void>
  reset: () => void
}

const emptyLibrary = {
  liveCategories: [],
  vodCategories: [],
  seriesCategories: [],
  liveStreams: [],
  vodStreams: [],
  series: [],
  m3uChannels: [],
}

export const useLibraryStore = create<LibraryState>((set) => ({
  status: 'idle',
  error: null,
  ...emptyLibrary,

  loadXtream: async ({ server, username, password }) => {
    set({ status: 'loading', error: null })
    try {
      const [liveCategories, vodCategories, seriesCategories, liveStreams, vodStreams, series] =
        await Promise.all([
          getLiveCategories(server, username, password),
          getVodCategories(server, username, password),
          getSeriesCategories(server, username, password),
          getLiveStreams(server, username, password),
          getVodStreams(server, username, password),
          getSeriesList(server, username, password),
        ])
      set({
        status: 'ready',
        liveCategories,
        vodCategories,
        seriesCategories,
        liveStreams,
        vodStreams,
        series,
        m3uChannels: [],
      })
    } catch (err) {
      set({ status: 'error', error: (err as Error).message })
    }
  },

  loadM3U: async (url) => {
    set({ status: 'loading', error: null })
    try {
      const { channels } = await fetchM3U(url)
      set({ status: 'ready', ...emptyLibrary, m3uChannels: channels })
    } catch (err) {
      set({ status: 'error', error: (err as Error).message })
    }
  },

  reset: () => set({ status: 'idle', error: null, ...emptyLibrary }),
}))
