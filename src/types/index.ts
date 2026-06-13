export type VoiceState = 'disconnected' | 'connecting' | 'listening' | 'speaking' | 'executing'

export type GlowColor = 'blue' | 'pink' | 'none'

export interface VoiceStateConfig {
  state: VoiceState
  glowColor: GlowColor
  label: string
  micActive: boolean
  animating: boolean
}

export const VOICE_STATE_MAP: Record<VoiceState, VoiceStateConfig> = {
  disconnected: {
    state: 'disconnected',
    glowColor: 'none',
    label: 'Tap to start',
    micActive: false,
    animating: false,
  },
  connecting: {
    state: 'connecting',
    glowColor: 'blue',
    label: 'Connecting...',
    micActive: false,
    animating: true,
  },
  listening: {
    state: 'listening',
    glowColor: 'blue',
    label: 'Listening...',
    micActive: true,
    animating: true,
  },
  speaking: {
    state: 'speaking',
    glowColor: 'pink',
    label: 'Responding...',
    micActive: false,
    animating: true,
  },
  executing: {
    state: 'executing',
    glowColor: 'blue',
    label: 'Executing...',
    micActive: false,
    animating: true,
  },
}

export type ToolName =
  | 'openWebsite'
  | 'searchGoogle'
  | 'openYouTube'
  | 'createTask'
  | 'setReminder'
  | 'sendEmail'
  | 'getTime'
  | 'takeNotes'

export interface ToolCall {
  id: string
  name: ToolName
  args: Record<string, string>
  timestamp: number
}

export interface AudioLevel {
  level: number // 0-1
  time: number
}

export interface Particle {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  speedX: number
  speedY: number
  color: string
}