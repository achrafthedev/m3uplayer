import { withProxy } from './proxy'
import type { M3UChannel } from '../types'

const ATTR_RE = /([a-zA-Z0-9_-]+)="([^"]*)"/g

export function parseM3U(content: string): M3UChannel[] {
  const lines = content.split(/\r?\n/)
  const channels: M3UChannel[] = []
  let pending: Partial<M3UChannel> | null = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    if (line.startsWith('#EXTINF')) {
      const commaIdx = line.indexOf(',')
      const attrsPart = commaIdx >= 0 ? line.slice(0, commaIdx) : line
      const name = commaIdx >= 0 ? line.slice(commaIdx + 1).trim() : 'Unknown'
      const attrs: Record<string, string> = {}
      ATTR_RE.lastIndex = 0
      let m: RegExpExecArray | null
      while ((m = ATTR_RE.exec(attrsPart))) {
        attrs[m[1].toLowerCase()] = m[2]
      }
      pending = {
        name: name || attrs['tvg-name'] || 'Unknown',
        logo: attrs['tvg-logo'] || undefined,
        groupTitle: attrs['group-title'] || undefined,
        tvgId: attrs['tvg-id'] || undefined,
      }
    } else if (line.startsWith('#')) {
      continue
    } else if (pending) {
      channels.push({ ...pending, url: line } as M3UChannel)
      pending = null
    }
  }

  return channels
}

export async function fetchM3U(url: string): Promise<{ text: string; channels: M3UChannel[] }> {
  let res: Response
  try {
    res = await fetch(withProxy(url))
  } catch {
    throw new Error('Network request failed — the server may be unreachable or blocking cross-origin requests (CORS). See README for using a proxy.')
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  const text = await res.text()
  if (!text.includes('#EXTM3U') && !text.includes('#EXTINF')) {
    throw new Error('Response does not look like a valid M3U playlist')
  }
  return { text, channels: parseM3U(text) }
}
