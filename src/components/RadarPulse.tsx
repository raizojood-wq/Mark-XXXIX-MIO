interface RadarPulseProps {
  isActive: boolean
  isSpeaking: boolean
}

export function RadarPulse({ isActive, isSpeaking }: RadarPulseProps) {
  const color = isSpeaking ? '#ec4899' : '#3b82f6'

  if (!isActive) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Multiple radar rings */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: `${50 + i * 40}px`,
            height: `${50 + i * 40}px`,
            borderColor: color,
            borderWidth: '1px',
            opacity: 0.3 - i * 0.08,
            animation: `radar-pulse ${2 + i * 0.5}s ease-out infinite`,
            animationDelay: `${i * 0.6}s`,
          }}
        />
      ))}

      {/* Scanning line */}
      <div
        className="absolute rounded-full"
        style={{
          width: '200px',
          height: '200px',
          background: `conic-gradient(from 0deg, transparent 0%, ${color}33 10%, ${color}11 20%, transparent 30%, transparent 100%)`,
          animation: 'rotate-ring 4s linear infinite',
          opacity: 0.4,
        }}
      />
    </div>
  )
}