import { useCallback, useRef, useState } from 'react'
import type { VoiceState } from '../types'

export function useVoiceStateManager() {
  const [state, setState] = useState<VoiceState>('disconnected')
  const stateRef = useRef<VoiceState>('disconnected')

  const transitionTo = useCallback((newState: VoiceState) => {
    const current = stateRef.current
    console.log(`[VoiceState] ${current} → ${newState}`)
    stateRef.current = newState
    setState(newState)
  }, [])

  const canTransition = useCallback((from: VoiceState, to: VoiceState): boolean => {
    const validTransitions: Record<VoiceState, VoiceState[]> = {
      disconnected: ['connecting'],
      connecting: ['listening', 'disconnected'],
      listening: ['speaking', 'executing', 'disconnected'],
      speaking: ['listening', 'executing', 'disconnected'],
      executing: ['listening', 'speaking', 'disconnected'],
    }
    return validTransitions[from]?.includes(to) ?? false
  }, [])

  const safeTransition = useCallback((to: VoiceState) => {
    const from = stateRef.current
    if (canTransition(from, to)) {
      transitionTo(to)
    } else {
      console.warn(`[VoiceState] Invalid transition: ${from} → ${to}`)
    }
  }, [canTransition, transitionTo])

  return {
    state,
    stateRef,
    transitionTo,
    safeTransition,
  }
}