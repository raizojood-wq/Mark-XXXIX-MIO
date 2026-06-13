import type { VoiceState } from '../types'
import { toolExecutor } from './ToolExecutor'
import type { ToolName } from '../types'

export interface UIControllerCallbacks {
  onStateChange: (state: VoiceState) => void
  onToolExecuting: (toolName: string) => void
  onToolResult: (result: string) => void
  onError: (error: string) => void
}

export class UIController {
  private callbacks: UIControllerCallbacks | null = null

  init(callbacks: UIControllerCallbacks) {
    this.callbacks = callbacks

    toolExecutor.setOnExecutionStart((call) => {
      this.callbacks?.onStateChange('executing')
      this.callbacks?.onToolExecuting(call.name)
    })

    toolExecutor.setOnExecutionEnd((_call, result) => {
      this.callbacks?.onStateChange('listening')
      this.callbacks?.onToolResult(result)
    })

    toolExecutor.setOnExecutionError((_call, error) => {
      this.callbacks?.onStateChange('listening')
      this.callbacks?.onError(error.message)
    })
  }

  async handleToolCall(name: string, args: Record<string, string>) {
    try {
      const result = await toolExecutor.execute(name as ToolName, args)
      return result
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      this.callbacks?.onError(msg)
      return `Error: ${msg}`
    }
  }

  getAvailableTools() {
    return toolExecutor.getAvailableTools()
  }

  getToolHistory() {
    return toolExecutor.getHistory()
  }
}

// Singleton
export const uiController = new UIController()