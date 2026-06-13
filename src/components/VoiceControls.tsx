interface VoiceControlsProps {
  isConnected: boolean
  onToggle: () => void
  isSpeaking?: boolean
}

export function VoiceControls({ isConnected, onToggle, isSpeaking }: VoiceControlsProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Main toggle button */}
      <button
        onClick={onToggle}
        className={`
          relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center
          transition-all duration-300 ease-out
          focus:outline-none focus:ring-2 focus:ring-white/20
          active:scale-95
          ${isConnected
            ? isSpeaking
              ? 'bg-pink-500/20 hover:bg-pink-500/30'
              : 'bg-blue-500/20 hover:bg-blue-500/30'
            : 'bg-white/5 hover:bg-white/10'
          }
        `}
        aria-label={isConnected ? 'Disconnect' : 'Connect'}
      >
        {/* Glow ring */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-300 ${
            isConnected
              ? isSpeaking
                ? 'shadow-[0_0_30px_rgba(236,72,153,0.3)]'
                : 'shadow-[0_0_30px_rgba(59,130,246,0.3)]'
              : 'shadow-none'
          }`}
        />

        {/* Icon */}
        <svg
          className={`relative z-10 w-7 h-7 sm:w-8 sm:h-8 transition-colors duration-300 ${
            isConnected ? 'text-white' : 'text-white/50'
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isConnected ? (
            // Mic icon (listening)
            <>
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </>
          ) : (
            // Power/play icon (disconnected)
            <polygon points="5 3 19 12 5 21 5 3" />
          )}
        </svg>

        {/* Ripple on active */}
        {isConnected && (
          <span
            className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
              isSpeaking ? 'bg-pink-400' : 'bg-blue-400'
            }`}
            style={{ animationDuration: '2s' }}
          />
        )}
      </button>
    </div>
  )
}