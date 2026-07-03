import { useEffect, useRef, useState } from 'react'
import mpegts from 'mpegts.js'
import Hls from 'hls.js'

function detectType(url: string): 'mse-ts' | 'hls' | 'native' {
  const clean = url.split('?')[0].toLowerCase()
  if (clean.endsWith('.m3u8')) return 'hls'
  if (clean.endsWith('.ts') || url.includes('output=mpegts') || url.includes('output=ts')) return 'mse-ts'
  return 'native'
}

const STALL_TIMEOUT_MS = 15000

interface VideoPlayerProps {
  src: string
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    setErrorMsg(null)
    let destroyed = false
    let mpegtsPlayer: ReturnType<typeof mpegts.createPlayer> | null = null
    let hls: Hls | null = null

    function fail(msg: string) {
      if (destroyed) return
      setErrorMsg(msg)
    }

    const stallTimer = window.setTimeout(() => {
      if (!destroyed && video.readyState === 0) {
        fail(
          "Stream isn't responding. This can happen if your account only allows one active connection and it's already in use elsewhere, the channel is offline, or the server is blocking the request.",
        )
      }
    }, STALL_TIMEOUT_MS)

    function clearStallTimer() {
      window.clearTimeout(stallTimer)
    }
    video.addEventListener('loadeddata', clearStallTimer)
    video.addEventListener('error', () => fail('Video playback error'))

    const type = detectType(src)

    if (type === 'mse-ts') {
      if (!mpegts.isSupported()) {
        fail("This browser can't play MPEG-TS live streams. Try switching the live stream format to HLS (m3u8) in Settings.")
      } else {
        mpegtsPlayer = mpegts.createPlayer({ type: 'mpegts', isLive: true, url: src })
        mpegtsPlayer.attachMediaElement(video)
        mpegtsPlayer.on(mpegts.Events.ERROR, (errType: unknown, detail: unknown) => {
          fail(`Playback error (${String(errType)}): ${String(detail)}`)
        })
        mpegtsPlayer.load()
        Promise.resolve(mpegtsPlayer.play()).catch(() => {
          /* autoplay can be blocked until the user interacts with the page */
        })
      }
    } else if (type === 'hls') {
      if (Hls.isSupported()) {
        hls = new Hls()
        hls.loadSource(src)
        hls.attachMedia(video)
        hls.on(Hls.Events.ERROR, (_evt, data) => {
          if (data.fatal) fail(`Playback error (hls: ${data.type})`)
        })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src
        video.play().catch(() => {})
      } else {
        fail('HLS playback is not supported in this browser')
      }
    } else {
      video.src = src
      video.play().catch(() => {})
    }

    return () => {
      destroyed = true
      clearStallTimer()
      video.removeEventListener('loadeddata', clearStallTimer)
      mpegtsPlayer?.destroy()
      hls?.destroy()
      video.removeAttribute('src')
      video.load()
    }
  }, [src])

  return (
    <div className="video-player">
      <video ref={videoRef} controls autoPlay playsInline />
      {errorMsg && <div className="video-error">{errorMsg}</div>}
    </div>
  )
}
