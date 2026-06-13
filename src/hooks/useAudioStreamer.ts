import { useCallback, useRef, useState } from 'react'
import type { AudioLevel } from '../types'

const FFT_SIZE = 256

export function useAudioStreamer() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [audioLevels, setAudioLevels] = useState<AudioLevel[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationRef = useRef<number>(0)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const onAudioDataRef = useRef<((buffer: Int16Array) => void) | null>(null)

  const startStream = useCallback(async (onAudioData?: (buffer: Int16Array) => void) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      streamRef.current = stream

      const ctx = new AudioContext({ sampleRate: 16000 })
      contextRef.current = ctx

      const source = ctx.createMediaStreamSource(stream)
      sourceRef.current = source

      const analyser = ctx.createAnalyser()
      analyser.fftSize = FFT_SIZE
      source.connect(analyser)
      analyserRef.current = analyser

      if (onAudioData) {
        onAudioDataRef.current = onAudioData
        const processor = ctx.createScriptProcessor(4096, 1, 1)
        source.connect(processor)
        processor.connect(ctx.destination)
        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0)
          const pcm16 = new Int16Array(input.length)
          for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]))
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
          }
          onAudioDataRef.current?.(pcm16)
        }
        processorRef.current = processor
      }

      setIsStreaming(true)

      // Start visualizer
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      const now = Date.now()

      const updateLevels = () => {
        analyser.getByteTimeDomainData(dataArray)
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          const value = (dataArray[i] - 128) / 128
          sum += value * value
        }
        const rms = Math.sqrt(sum / bufferLength)
        const level = Math.min(1, rms * 3)

        setAudioLevels(prev => {
          const next = [...prev, { level, time: Date.now() }]
          return next.slice(-60)
        })

        animationRef.current = requestAnimationFrame(updateLevels)
      }
      updateLevels()

      return stream
    } catch (err) {
      console.error('Failed to start audio stream:', err)
      return null
    }
  }, [])

  const stopStream = useCallback(() => {
    cancelAnimationFrame(animationRef.current)
    processorRef.current?.disconnect()
    processorRef.current = null
    sourceRef.current?.disconnect()
    sourceRef.current = null
    analyserRef.current = null
    contextRef.current?.close()
    contextRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setIsStreaming(false)
    setAudioLevels([])
  }, [])

  return {
    isStreaming,
    audioLevels,
    startStream,
    stopStream,
    setOnAudioData: (cb: (buffer: Int16Array) => void) => { onAudioDataRef.current = cb },
  }
}