import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  corsProxy: string
  liveOutputFormat: 'ts' | 'm3u8'
  setCorsProxy: (value: string) => void
  setLiveOutputFormat: (value: 'ts' | 'm3u8') => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      corsProxy: '',
      liveOutputFormat: 'ts',
      setCorsProxy: (value) => set({ corsProxy: value }),
      setLiveOutputFormat: (value) => set({ liveOutputFormat: value }),
    }),
    { name: 'iptv-settings' },
  ),
)
