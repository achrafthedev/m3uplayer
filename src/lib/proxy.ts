import { useSettingsStore } from '../store/settingsStore'

/**
 * Many IPTV/Xtream panels don't send CORS headers, so the browser blocks
 * reading the response even though the request succeeds. If the user has
 * configured a CORS proxy (see README), route requests through it.
 */
export function withProxy(url: string): string {
  const proxy = useSettingsStore.getState().corsProxy.trim()
  if (!proxy) return url
  if (proxy.includes('{url}')) return proxy.replace('{url}', encodeURIComponent(url))
  return proxy.replace(/\/+$/, '') + '/' + url
}
