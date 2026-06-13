import type { VoiceState } from '../types'

interface AICoreProps {
  state: VoiceState
}

export function AICore({ state }: AICoreProps) {
  const isActive = state !== 'disconnected' && state !== 'connecting'
  const isSpeaking = state === 'speaking'
  const glowColor = isSpeaking ? 'pink' : 'blue'

  return (
    <div className="relative flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64">
      {/* Outer ring 1 - rotates clockwise */}
      <svg
        className={`absolute inset-0 w-full h-full animate-rotate-ring ${
          isActive ? 'opacity-100' : 'opacity-30'
        }`}
        viewBox="0 0 100 100"
        fill="none"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke={isSpeaking ? '#ec4899' : '#3b82f6'}
          strokeWidth="0.5"
          strokeDasharray="4 8"
          opacity="0.4"
        />
      </svg>

      {/* Outer ring 2 - rotates counter-clockwise */}
      <svg
        className={`absolute inset-0 w-full h-full animate-rotate-ring-reverse ${
          isActive ? 'opacity-100' : 'opacity-20'
        }`}
        viewBox="0 0 100 100"
        fill="none"
      >
        <circle
          cx="50"
          cy="50"
          r="38"
          stroke={isSpeaking ? '#ec4899' : '#6366f1'}
          strokeWidth="0.8"
          strokeDasharray="2 6"
          opacity="0.5"
        />
      </svg>

      {/* Inner ring - pulsing */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        fill="none"
      >
        <circle
          cx="50"
          cy="50"
          r="30"
          stroke={isSpeaking ? '#ec4899' : '#3b82f6'}
          strokeWidth="1"
          strokeDasharray="1 3"
          className={isActive ? 'animate-pulse-dot' : ''}
          opacity={isActive ? 0.6 : 0.2}
        />
      </svg>

      {/* Radar ring */}
      <svg
        className={`absolute inset-0 w-full h-full ${isActive ? 'animate-radar-pulse' : ''}`}
        viewBox="0 0 100 100"
        fill="none"
      >
        <circle
          cx="50"
          cy="50"
          r="48"
          stroke={glowColor === 'pink' ? '#ec4899' : '#3b82f6'}
          strokeWidth="2"
          opacity="0"
        />
      </svg>

      {/* Core orb */}
      <div
        className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full transition-all duration-500 ${
          isActive ? 'opacity-100' : 'opacity-50'
        }`}
        style={{
          background: isSpeaking
            ? 'radial-gradient(circle at 40% 40%, #fdf2f8 0%, #ec4899 40%, #4c0519 100%)'
            : 'radial-gradient(circle at 40% 40%, #dbeafe 0%, #3b82f6 40%, #0c1929 100%)',
          boxShadow: isSpeaking
            ? '0 0 60px rgba(236, 72, 153, 0.4), 0 0 120px rgba(236, 72, 153, 0.15)'
            : '0 0 60px rgba(59, 130, 246, 0.4), 0 0 120px rgba(59, 130, 246, 0.15)',
        }}
      >
        {/* Inner glow highlight */}
        <div
          className="absolute inset-2 rounded-full opacity-60"
          style={{
            background: isSpeaking
              ? 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.4) 0%, transparent 70%)'
              : 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.3) 0%, transparent 70%)',
          }}
        />

        {/* Center dot */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${
            isActive ? 'animate-pulse-dot' : ''
          }`}
          style={{
            background: isSpeaking
              ? 'radial-gradient(circle, #fdf2f8 0%, #ec4899 100%)'
              : 'radial-gradient(circle, #dbeafe 0%, #3b82f6 100%)',
          }}
        />
      </div>

      {/* Glow backdrop */}
      <div
        className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 ${
          isActive ? 'opacity-30 scale-110' : 'opacity-0 scale-90'
        }`}
        style={{
          background: isSpeaking
            ? 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
        }}
      />
    </div>
  )
}