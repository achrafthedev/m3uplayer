import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ConnectionMode, XtreamCredentials } from '../types'

interface ConnectionState {
  mode: ConnectionMode | null
  xtream: XtreamCredentials | null
  m3uUrl: string | null
  connectXtream: (creds: XtreamCredentials) => void
  connectM3U: (url: string) => void
  disconnect: () => void
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set) => ({
      mode: null,
      xtream: null,
      m3uUrl: null,
      connectXtream: (creds) => set({ mode: 'xtream', xtream: creds, m3uUrl: null }),
      connectM3U: (url) => set({ mode: 'm3u', m3uUrl: url, xtream: null }),
      disconnect: () => set({ mode: null, xtream: null, m3uUrl: null }),
    }),
    { name: 'iptv-connection' },
  ),
)
