import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * BoomerangVideoBg
 * ----------------------------------------------------------------------
 * Full-bleed background that plays a video forward once, captures every
 * presented frame into an offscreen atlas, then ping-pongs (boomerang)
 * those frames on a canvas at 30fps — forever.
 *
 * Why capture at all? A native <video loop> has a visible hard cut on
 * every restart. Re-drawing the captured frames in reverse gives the
 * "soft looping" motion the design calls for.
 */

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260715_090628_7052d8a6-a094-4341-a4a2-ad58493a67a9.mp4'

/**
 * Local mirror of the same clip. The sandboxed preview iframe and offline
 * dev runs have no network, so the remote URL cannot load there. The
 * component tries the CloudFront URL first (as specified) and only falls
 * back to this asset if that request fails.
 */
const LOCAL_FALLBACK_SRC = '/assets/hero.mp4'

/** Spec ceiling for captured frame width. */
const CAPTURE_MAX_WIDTH = 960
/** Playback cadence. */
const PLAYBACK_FPS = 30
const PLAYBACK_INTERVAL = 1000 / PLAYBACK_FPS

/**
 * Frame atlases are raw RGBA bitmaps, so memory is frames × w × h × 4.
 * We pick the largest width from the ladder that fits the budget instead
 * of blindly allocating ~500MB for a 1080p / 10s clip at 960px.
 * Anything the ladder refuses is re-checked against the 960 spec ceiling.
 */
const WIDTH_LADDER = [960, 880, 800, 720, 640, 560, 480, 400, 320]
const DESKTOP_BUDGET_BYTES = 288 * 1024 * 1024
const MOBILE_BUDGET_BYTES = 128 * 1024 * 1024

type Atlas = {
  canvas: HTMLCanvasElement
  count: number
  frameW: number
  frameH: number
  cols: number
}

function isCoarsePointer() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 768px)').matches || navigator.hardwareConcurrency <= 4
}

/** Largest capture width that (a) is ≤ 960 and (b) fits the byte budget. */
function chooseCaptureWidth(frameCount: number, budget: number, aspect: number) {
  const needed = WIDTH_LADDER.find((w) => {
    const h = Math.round(w / aspect)
    return frameCount * w * h * 4 <= budget
  })
  return Math.min(needed ?? 320, CAPTURE_MAX_WIDTH)
}

/** object-fit: cover maths for a canvas drawImage call. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dw: number,
  dh: number,
  alignTop = true,
) {
  const scale = Math.max(dw / sw, dh / sh)
  const w = sw * scale
  const h = sh * scale
  const x = (dw - w) / 2
  const y = alignTop ? 0 : (dh - h) / 2
  ctx.drawImage(source, sx, sy, sw, sh, x, y, w, h)
}

export default function BoomerangVideoBg({ className = '' }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const atlasRef = useRef<Atlas | null>(null)
  const rafRef = useRef<number | null>(null)
  const intervalRef = useRef<number | null>(null)
  const cancelVfcRef = useRef<(() => void) | null>(null)
  const lastCapturedTimeRef = useRef(-1)
  const frameIndexRef = useRef(0)
  const directionRef = useRef(1)

  const [src, setSrc] = useState(VIDEO_SRC)
  const [framesReady, setFramesReady] = useState(false)

  /** Paint one captured frame, scaled to fill the canvas (object-cover). */
  const paintFrame = useCallback((index: number) => {
    const atlas = atlasRef.current
    const canvas = canvasRef.current
    if (!atlas || !canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const i = Math.max(0, Math.min(index, atlas.count - 1))
    const col = i % atlas.cols
    const row = Math.floor(i / atlas.cols)
    const dw = canvas.width
    const dh = canvas.height
    if (!dw || !dh) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, dw, dh)
    drawCover(
      ctx,
      atlas.canvas,
      col * atlas.frameW,
      row * atlas.frameH,
      atlas.frameW,
      atlas.frameH,
      dw,
      dh,
    )
  }, [])

  /** Size the display canvas to its CSS box (× DPR) and repaint. */
  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.max(1, Math.round(rect.width * dpr))
    const h = Math.max(1, Math.round(rect.height * dpr))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
      paintFrame(frameIndexRef.current)
    }
  }, [paintFrame])

  const startPlayback = useCallback(() => {
    if (intervalRef.current !== null) return
    syncCanvasSize()
    intervalRef.current = window.setInterval(() => {
      const atlas = atlasRef.current
      if (!atlas || atlas.count === 0) return

      paintFrame(frameIndexRef.current)

      if (atlas.count === 1) return
      frameIndexRef.current += directionRef.current
      if (frameIndexRef.current >= atlas.count - 1) {
        frameIndexRef.current = atlas.count - 1
        directionRef.current = -1
      } else if (frameIndexRef.current <= 0) {
        frameIndexRef.current = 0
        directionRef.current = 1
      }
    }, PLAYBACK_INTERVAL)
  }, [paintFrame, syncCanvasSize])

  const stopCaptureLoops = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (cancelVfcRef.current) {
      cancelVfcRef.current()
      cancelVfcRef.current = null
    }
  }, [])

  /** Allocate the atlas + run the capture loop for one playthrough. */
  const beginCapture = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 10
    const aspect = video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : 16 / 9
    const coarse = isCoarsePointer()

    // Playback smoother than capture cadence is pointless; on small devices
    // we sample at 15fps to halve memory for a visually identical result.
    const captureFps = coarse ? 15 : 30
    const interval = 1 / captureFps
    const capacity = Math.min(1024, Math.ceil(duration * captureFps) + 8)

    const budget = coarse ? MOBILE_BUDGET_BYTES : DESKTOP_BUDGET_BYTES
    const frameW = chooseCaptureWidth(capacity, budget, aspect)
    const frameH = Math.max(2, Math.round(frameW / aspect))

    const cols = Math.max(1, Math.min(capacity, Math.floor(16000 / frameW)))
    const rows = Math.ceil(capacity / cols)

    const atlasCanvas = document.createElement('canvas')
    atlasCanvas.width = cols * frameW
    atlasCanvas.height = rows * frameH
    const atlasCtx = atlasCanvas.getContext('2d', { alpha: false })
    if (!atlasCtx) return
    atlasCtx.fillStyle = '#ffffff'
    atlasCtx.fillRect(0, 0, atlasCanvas.width, atlasCanvas.height)

    const atlas: Atlas = { canvas: atlasCanvas, count: 0, frameW, frameH, cols }
    atlasRef.current = atlas

    const grab = () => {
      if (atlas.count >= capacity) return
      const t = video.currentTime
      // Deduplicate: rVFC can fire more than once per decoded frame and
      // rAF fires far faster than the source frame rate.
      if (t - lastCapturedTimeRef.current < interval * 0.5) return
      if (t === lastCapturedTimeRef.current) return
      lastCapturedTimeRef.current = t

      const col = atlas.count % cols
      const row = Math.floor(atlas.count / cols)
      try {
        atlasCtx.drawImage(video, col * frameW, row * frameH, frameW, frameH)
        atlas.count += 1
      } catch {
        /* tainted canvas or a frame that is not decodable yet — skip it */
      }
    }

    // Preferred path: exact presented-frame callbacks.
    const withVfc = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number
      cancelVideoFrameCallback?: (handle: number) => void
    }

    if (typeof withVfc.requestVideoFrameCallback === 'function') {
      let handle = 0
      const onFrame = () => {
        grab()
        if (!video.ended) handle = withVfc.requestVideoFrameCallback!(onFrame)
      }
      handle = withVfc.requestVideoFrameCallback(onFrame)
      cancelVfcRef.current = () => {
        if (typeof withVfc.cancelVideoFrameCallback === 'function') {
          withVfc.cancelVideoFrameCallback(handle)
        }
      }
    } else {
      const tick = () => {
        grab()
        if (!video.ended) rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    lastCapturedTimeRef.current = -1
    void video.play().catch(() => {
      /* autoplay can be blocked; the poster/white page stays clean */
    })
    beginCapture()
  }, [beginCapture])

  const handleEnded = useCallback(() => {
    stopCaptureLoops()
    const atlas = atlasRef.current
    if (!atlas || atlas.count < 2) {
      // Capture failed (e.g. tainted canvas): restart the video as a loop.
      const video = videoRef.current
      if (video) {
        video.loop = true
        void video.play().catch(() => {})
      }
      return
    }
    frameIndexRef.current = 0
    directionRef.current = 1
    setFramesReady(true)
    startPlayback()
  }, [startPlayback, stopCaptureLoops])

  // Network failure (offline preview / blocked CDN) → local mirror.
  const handleError = useCallback(() => {
    setSrc((current) => (current === LOCAL_FALLBACK_SRC ? current : LOCAL_FALLBACK_SRC))
  }, [])

  useEffect(() => {
    syncCanvasSize()
    const canvas = canvasRef.current
    if (!canvas || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => syncCanvasSize())
    observer.observe(canvas)
    window.addEventListener('orientationchange', syncCanvasSize)
    return () => {
      observer.disconnect()
      window.removeEventListener('orientationchange', syncCanvasSize)
    }
  }, [syncCanvasSize])

  useEffect(() => {
    return () => {
      stopCaptureLoops()
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      atlasRef.current = null
    }
  }, [stopCaptureLoops])

  return (
    <div className={`absolute inset-0 z-0 ${className}`} aria-hidden="true">
      <div className="h-full w-full origin-top scale-[1.15] overflow-hidden">
        {!framesReady && (
          <video
            ref={videoRef}
            key={src}
            src={src}
            muted
            playsInline
            preload="auto"
            crossOrigin="anonymous"
            className="h-full w-full object-cover object-top"
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onError={handleError}
          />
        )}
        <canvas
          ref={canvasRef}
          className="h-full w-full object-cover object-top"
          style={{ display: framesReady ? 'block' : 'none' }}
        />
      </div>
    </div>
  )
}
