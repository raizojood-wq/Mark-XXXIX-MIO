import { useEffect, useRef } from 'react'
import type { AudioLevel } from '../types'

interface VoiceWaveformProps {
  isActive: boolean
  isSpeaking: boolean
  levels: AudioLevel[]
}

const BAR_COUNT = 32

export function VoiceWaveform({ isActive, isSpeaking, levels }: VoiceWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const currentLevel = levels.length > 0 ? levels[levels.length - 1].level : 0

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center gap-[2px] sm:gap-[3px] h-12 sm:h-16 transition-all duration-300"
    >
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        // Calculate a unique height for each bar based on the current audio level
        const center = BAR_COUNT / 2
        const distance = Math.abs(i - center) / center
        const variance = Math.sin(Date.now() / 300 + i) * 0.3 + 0.7
        const heightScale = isActive ? currentLevel * variance : 0.1
        const barHeight = Math.max(2, Math.min(48, heightScale * 48 * (1 - distance * 0.4)))

        // For speaking state, make bars fluctuate more
        const speakMod = isSpeaking ? Math.sin(Date.now() / 200 + i * 0.5) * 0.4 + 0.6 : 1
        const finalHeight = barHeight * speakMod

        return (
          <div
            key={i}
            className="rounded-full transition-all duration-75"
            style={{
              height: `${Math.max(2, finalHeight)}px`,
              width: isActive ? '3px' : '2px',
              backgroundColor: isSpeaking
                ? `rgba(236, 72, 153, ${0.3 + (finalHeight / 48) * 0.7})`
                : `rgba(59, 130, 246, ${0.3 + (finalHeight / 48) * 0.7})`,
              boxShadow: isActive
                ? isSpeaking
                  ? `0 0 6px rgba(236, 72, 153, ${0.2 + (finalHeight / 48) * 0.4})`
                  : `0 0 6px rgba(59, 130, 246, ${0.2 + (finalHeight / 48) * 0.4})`
                : 'none',
              transition: 'height 75ms ease, opacity 75ms ease',
            }}
          />
        )
      })}
    </div>
  )
}