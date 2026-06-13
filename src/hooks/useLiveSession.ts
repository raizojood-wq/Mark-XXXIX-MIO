import { useCallback, useRef } from 'react'

interface LiveSessionConfig {
  onAudioOut?: (buffer: Int16Array) => void
  onToolCall?: (toolName: string, args: Record<string, string>) => void
  onStateChange?: (state: string) => void
  onError?: (error: Error) => void
}

interface GeminiLiveResponse {
  text?: string
  toolCall?: {
    name: string
    args: Record<string, string>
  }
  audioData?: ArrayBuffer
}

export function useLiveSession() {
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const configRef = useRef<LiveSessionConfig>({})

  const connect = useCallback(async (config: LiveSessionConfig) => {
    configRef.current = config

    // Create audio context for playback (24kHz output)
    const audioCtx = new AudioContext({ sampleRate: 24000 })
    audioContextRef.current = audioCtx
    gainNodeRef.current = audioCtx.createGain()
    gainNodeRef.current.connect(audioCtx.destination)

    // WebSocket connection to Gemini Live API
    // In production, this would go through a relay/proxy for API key security
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const ws = new WebSocket(`${protocol}//${host}/api/live`)

    ws.onopen = () => {
      config.onStateChange?.('connected')
    }

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data) as GeminiLiveResponse

        if (data.toolCall) {
          config.onToolCall?.(data.toolCall.name, data.toolCall.args)
        }

        if (data.audioData) {
          // Decode base64 audio and play
          const binaryStr = atob(data.audioData as unknown as string)
          const bytes = new Uint8Array(binaryStr.length)
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i)
          }
          const int16 = new Int16Array(bytes.buffer)
          config.onAudioOut?.(int16)

          // Play through audio context
          const float32 = new Float32Array(int16.length)
          for (let i = 0; i < int16.length; i++) {
            float32[i] = int16[i] / 32768
          }
          const buffer = audioCtx.createBuffer(1, float32.length, 24000)
          buffer.getChannelData(0).set(float32)

          const source = audioCtx.createBufferSource()
          source.buffer = buffer
          source.connect(gainNodeRef.current!)
          source.start()
        }

        if (data.text) {
          // Text is for debug/logging; UI is voice-first
          console.log('[Gemini]', data.text)
        }
      } catch (err) {
        console.error('Failed to parse message:', err)
      }
    }

    ws.onerror = (err) => {
      console.error('[LiveSession] WS error:', err)
      config.onError?.(new Error('WebSocket error'))
    }

    ws.onclose = () => {
      config.onStateChange?.('disconnected')
    }

    wsRef.current = ws
    return ws
  }, [])

  const sendAudio = useCallback((pcm16: Int16Array) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Send PCM16 audio data over WebSocket as base64
      const bytes = new Uint8Array(pcm16.buffer)
      let binary = ''
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      wsRef.current.send(JSON.stringify({
        type: 'audio',
        data: btoa(binary),
      }))
    }
  }, [])

  const disconnect = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
    audioContextRef.current?.close()
    audioContextRef.current = null
    gainNodeRef.current = null
  }, [])

  const isConnected = () => wsRef.current?.readyState === WebSocket.OPEN

  return {
    connect,
    sendAudio,
    disconnect,
    isConnected,
  }
}