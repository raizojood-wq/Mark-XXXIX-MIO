import { useCallback, useState } from 'react'
import { AICore } from './components/AICore'
import { ParticleField } from './components/ParticleField'
import { VoiceControls } from './components/VoiceControls'
import { StatusIndicator } from './components/StatusIndicator'
import { VoiceWaveform } from './components/VoiceWaveform'
import { RadarPulse } from './components/RadarPulse'
import { FaceCam } from './components/FaceCam'
import { useVoiceStateManager } from './hooks/useVoiceStateManager'
import { useAudioStreamer } from './hooks/useAudioStreamer'
import { useLiveSession } from './hooks/useLiveSession'
import { uiController } from './services/UIController'
import type { VoiceState } from './types'
import { VOICE_STATE_MAP } from './types'

function App() {
  const { state, safeTransition } = useVoiceStateManager()
  const audioStreamer = useAudioStreamer()
  const liveSession = useLiveSession()
  const [faceCamEnabled, setFaceCamEnabled] = useState(false)
  const [toolName, setToolName] = useState<string | undefined>(undefined)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const config = VOICE_STATE_MAP[state]

  const handleToggle = useCallback(async () => {
    if (state === 'disconnected') {
      setErrorMessage(null)
      safeTransition('connecting')

      // Initialize UI controller
      uiController.init({
        onStateChange: (newState: VoiceState) => safeTransition(newState),
        onToolExecuting: (tool: string) => setToolName(tool),
        onToolResult: (result: string) => console.log('[Tool]', result),
        onError: (err: string) => setErrorMessage(err),
      })

      try {
        // Start audio stream
        await audioStreamer.startStream((pcm16) => {
          liveSession.sendAudio(pcm16)
        })

        // Connect to live session
        await liveSession.connect({
          onAudioOut: (_buffer) => {
            // Audio playback handled in hook
          },
          onToolCall: (name, args) => {
            uiController.handleToolCall(name, args)
          },
          onStateChange: (sessionState) => {
            if (sessionState === 'connected') {
              safeTransition('listening')
            } else if (sessionState === 'disconnected') {
              safeTransition('disconnected')
            }
          },
          onError: (err) => {
            setErrorMessage(err.message)
            safeTransition('disconnected')
          },
        })

        // Simulate: after connecting, go to listening
        safeTransition('listening')
      } catch (err) {
        console.error('Connection failed:', err)
        setErrorMessage('Failed to connect. Please try again.')
        safeTransition('disconnected')
      }
    } else {
      // Disconnect
      liveSession.disconnect()
      audioStreamer.stopStream()
      safeTransition('disconnected')
      setToolName(undefined)
      setErrorMessage(null)
    }
  }, [state, safeTransition, audioStreamer, liveSession])

  const handleFaceCamToggle = useCallback(() => {
    setFaceCamEnabled(prev => !prev)
  }, [])

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden bg-[#05050f]">
      {/* Particle Background */}
      <ParticleField isActive={state !== 'disconnected'} />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full min-h-screen px-4 safe-top safe-bottom">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 safe-top">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: config.glowColor === 'none'
                  ? '#3b82f6'
                  : config.glowColor === 'pink'
                    ? '#ec4899'
                    : '#3b82f6',
              }}
            />
            <span className="text-sm font-semibold tracking-widest text-white/70 uppercase">
              Nexa
            </span>
          </div>

          {/* Face cam toggle */}
          <button
            onClick={handleFaceCamToggle}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              transition-all duration-200 focus:outline-none
              ${faceCamEnabled
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
              }
            `}
            aria-label="Toggle face camera"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <span className="hidden sm:inline">Camera</span>
          </button>
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 sm:gap-8">
          {/* AI Core */}
          <div className="relative">
            <RadarPulse
              isActive={state !== 'disconnected' && state !== 'connecting'}
              isSpeaking={state === 'speaking'}
            />
            <AICore state={state} />
          </div>

          {/* Status */}
          <StatusIndicator state={state} toolName={toolName} />

          {/* Voice Waveform */}
          <VoiceWaveform
            isActive={state === 'listening' || state === 'speaking'}
            isSpeaking={state === 'speaking'}
            levels={audioStreamer.audioLevels}
          />

          {/* Error message */}
          {errorMessage && (
            <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs max-w-xs text-center animate-fade-in-up">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="flex flex-col items-center gap-4 pb-4 sm:pb-8">
          <VoiceControls
            isConnected={state !== 'disconnected'}
            onToggle={handleToggle}
            isSpeaking={state === 'speaking'}
          />

          {/* Connection status dot */}
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                state === 'disconnected'
                  ? 'bg-red-500/50'
                  : state === 'connecting'
                    ? 'bg-yellow-500 animate-pulse'
                    : config.glowColor === 'pink'
                      ? 'bg-pink-400 animate-pulse'
                      : 'bg-blue-400 animate-pulse'
              }`}
            />
            <span className="text-[10px] uppercase tracking-widest text-white/30 font-mono">
              {state}
            </span>
          </div>
        </div>
      </div>

      {/* Face Cam */}
      <FaceCam enabled={faceCamEnabled} />
    </div>
  )
}

export default App