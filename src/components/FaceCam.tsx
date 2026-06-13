import { useCallback, useEffect, useRef, useState } from 'react'

interface FaceCamProps {
  enabled: boolean
}

export function FaceCam({ enabled }: FaceCamProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [hasPermission, setHasPermission] = useState(false)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 320 },
          height: { ideal: 240 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setHasPermission(true)
    } catch (err) {
      console.warn('[FaceCam] Permission denied or camera unavailable:', err)
      setHasPermission(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setHasPermission(false)
  }, [])

  useEffect(() => {
    if (enabled && !hasPermission) {
      startCamera()
    } else if (!enabled && hasPermission) {
      stopCamera()
    }
  }, [enabled, hasPermission, startCamera, stopCamera])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  if (!enabled || !hasPermission) return null

  return (
    <div className="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 z-30 rounded-xl overflow-hidden shadow-2xl border border-white/10"
         style={{ width: '120px', height: '90px' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10 pointer-events-none" />
    </div>
  )
}