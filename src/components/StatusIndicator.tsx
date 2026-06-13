import type { VoiceState } from '../types'

interface StatusIndicatorProps {
  state: VoiceState
  toolName?: string
}

const STATUS_LABELS: Record<VoiceState, { label: string; sublabel?: string }> = {
  disconnected: {
    label: 'Tap to start',
    sublabel: 'Nexa is ready',
  },
  connecting: {
    label: 'Connecting...',
    sublabel: 'Establishing secure link',
  },
  listening: {
    label: 'Listening...',
    sublabel: 'I\'m all ears',
  },
  speaking: {
    label: 'Responding...',
    sublabel: 'Processing your request',
  },
  executing: {
    label: 'Executing...',
    sublabel: 'Running command',
  },
}

export function StatusIndicator({ state, toolName }: StatusIndicatorProps) {
  const { label, sublabel } = STATUS_LABELS[state]
  const isPulsing = state === 'listening' || state === 'speaking' || state === 'executing'

  return (
    <div className="flex flex-col items-center gap-1 animate-fade-in-up">
      <div className="flex items-center gap-2">
        {isPulsing && (
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              state === 'speaking' ? 'bg-pink-400' : 'bg-blue-400'
            } animate-pulse-dot`}
          />
        )}
        <span className="text-sm sm:text-base font-medium tracking-wider text-white/80">
          {label}
        </span>
      </div>
      <span className="text-xs text-white/40 tracking-wide">
        {toolName ? `${sublabel}: ${toolName}` : sublabel}
      </span>
    </div>
  )
}