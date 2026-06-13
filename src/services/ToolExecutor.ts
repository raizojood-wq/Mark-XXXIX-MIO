import type { ToolName, ToolCall } from '../types'

type ToolHandler = (args: Record<string, string>) => Promise<string>

export class ToolExecutor {
  private handlers: Map<ToolName, ToolHandler> = new Map()
  private history: ToolCall[] = []
  private onExecutionStart?: (call: ToolCall) => void
  private onExecutionEnd?: (call: ToolCall, result: string) => void
  private onExecutionError?: (call: ToolCall, error: Error) => void

  constructor() {
    this.registerDefaults()
  }

  private registerDefaults() {
    this.register('openWebsite', async (args) => {
      const url = args.url || args.query
      if (!url) throw new Error('URL is required')
      const fullUrl = url.startsWith('http') ? url : `https://${url}`
      window.open(fullUrl, '_blank', 'noopener,noreferrer')
      return `Opened ${fullUrl}`
    })

    this.register('searchGoogle', async (args) => {
      const query = args.query || args.q
      if (!query) throw new Error('Search query is required')
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer')
      return `Searched Google for "${query}"`
    })

    this.register('openYouTube', async (args) => {
      const query = args.query || args.q
      if (!query) throw new Error('Search query is required')
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer')
      return `Opened YouTube search for "${query}"`
    })

    this.register('createTask', async (args) => {
      const title = args.title || args.task
      if (!title) throw new Error('Task title is required')
      // Would integrate with task management system
      console.log('[Tool] createTask:', title, args)
      return `Task created: "${title}"`
    })

    this.register('setReminder', async (args) => {
      const text = args.text || args.message
      const time = args.time || args.when
      if (!text) throw new Error('Reminder text is required')
      console.log('[Tool] setReminder:', text, time)
      return `Reminder set: "${text}"${time ? ` at ${time}` : ''}`
    })

    this.register('sendEmail', async (args) => {
      const to = args.to
      const subject = args.subject
      if (!to || !subject) throw new Error('Recipient and subject are required')
      // Would open mailto or integrate with email
      window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}`, '_blank')
      return `Email drafted to ${to}`
    })

    this.register('getTime', async () => {
      const now = new Date()
      return `Current time: ${now.toLocaleTimeString()}, date: ${now.toLocaleDateString()}`
    })

    this.register('takeNotes', async (args) => {
      const notes = args.text || args.notes
      if (!notes) throw new Error('Notes text is required')
      console.log('[Tool] takeNotes:', notes)
      return `Notes recorded${args.title ? ` under "${args.title}"` : ''}`
    })
  }

  register(name: ToolName, handler: ToolHandler) {
    this.handlers.set(name, handler)
  }

  setOnExecutionStart(cb: (call: ToolCall) => void) {
    this.onExecutionStart = cb
  }

  setOnExecutionEnd(cb: (call: ToolCall, result: string) => void) {
    this.onExecutionEnd = cb
  }

  setOnExecutionError(cb: (call: ToolCall, error: Error) => void) {
    this.onExecutionError = cb
  }

  async execute(name: ToolName, args: Record<string, string>): Promise<string> {
    const call: ToolCall = {
      id: crypto.randomUUID(),
      name,
      args,
      timestamp: Date.now(),
    }

    const handler = this.handlers.get(name)
    if (!handler) {
      throw new Error(`Unknown tool: ${name}`)
    }

    this.onExecutionStart?.(call)
    this.history.push(call)

    try {
      const result = await handler(args)
      this.onExecutionEnd?.(call, result)
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.onExecutionError?.(call, err)
      throw err
    }
  }

  getHistory(): ToolCall[] {
    return [...this.history]
  }

  getAvailableTools(): ToolName[] {
    return Array.from(this.handlers.keys()) as ToolName[]
  }
}

// Singleton
export const toolExecutor = new ToolExecutor()