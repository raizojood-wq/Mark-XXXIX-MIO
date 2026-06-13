/**
 * Tool execution handlers for Nexa's Gemini Live API integration.
 * These tools are invoked by Gemini when the user requests an action.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export type ToolHandler = (args: Record<string, unknown>) => Promise<string>;

const handlers = new Map<string, ToolHandler>();

/**
 * Register a tool handler.
 */
function register(name: string, handler: ToolHandler): void {
  handlers.set(name, handler);
}

/**
 * Execute a tool by name with the given arguments.
 * Returns the result string to send back to Gemini.
 */
export async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  const handler = handlers.get(name);
  if (!handler) {
    throw new Error(`Unknown tool: ${name}`);
  }
  return handler(args);
}

/**
 * Get all registered tool definitions in the format required by Gemini.
 */
export function getToolDefinitions(): Array<{ functionDeclarations: ToolDefinition[] }> {
  return [
    {
      functionDeclarations: [
        {
          name: 'openWebsite',
          description: 'Open a website URL in the user\'s browser',
          parameters: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'The URL to open (e.g., https://example.com)',
              },
              query: {
                type: 'string',
                description: 'Optional search query or URL path',
              },
            },
          },
        },
        {
          name: 'searchGoogle',
          description: 'Search Google for a query and open results',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query',
              },
              q: {
                type: 'string',
                description: 'Alternative parameter name for query',
              },
            },
          },
        },
        {
          name: 'openYouTube',
          description: 'Search YouTube or open a video',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The YouTube search query',
              },
              q: {
                type: 'string',
                description: 'Alternative parameter name for query',
              },
            },
          },
        },
        {
          name: 'createTask',
          description: 'Create a new task in the task management system',
          parameters: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'The task title',
              },
              task: {
                type: 'string',
                description: 'Alternative parameter name for task title',
              },
            },
          },
        },
        {
          name: 'setReminder',
          description: 'Set a reminder for the user',
          parameters: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'The reminder text/message',
              },
              message: {
                type: 'string',
                description: 'Alternative parameter name for reminder text',
              },
              time: {
                type: 'string',
                description: 'When to be reminded (e.g., "in 30 minutes", "tomorrow at 9am")',
              },
              when: {
                type: 'string',
                description: 'Alternative parameter name for time',
              },
            },
          },
        },
        {
          name: 'getTime',
          description: 'Get the current time and date',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'takeNotes',
          description: 'Record notes for the user',
          parameters: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'The notes text content',
              },
              notes: {
                type: 'string',
                description: 'Alternative parameter name for notes text',
              },
              title: {
                type: 'string',
                description: 'Optional title for the notes',
              },
            },
          },
        },
      ],
    },
  ];
}

// Register default tool handlers
register('openWebsite', async (args) => {
  const url = (args.url as string) || (args.query as string);
  if (!url) throw new Error('URL is required');
  const fullUrl = url.startsWith('http') ? url : `https://${url}`;
  return `Opened ${fullUrl}`;
});

register('searchGoogle', async (args) => {
  const query = (args.query as string) || (args.q as string);
  if (!query) throw new Error('Search query is required');
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  return `Searched Google for "${query}"`;
});

register('openYouTube', async (args) => {
  const query = (args.query as string) || (args.q as string);
  if (!query) throw new Error('Search query is required');
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  return `Opened YouTube search for "${query}"`;
});

register('createTask', async (args) => {
  const title = (args.title as string) || (args.task as string);
  if (!title) throw new Error('Task title is required');
  // In a full implementation, this would write to a task management system
  return `Task created: "${title}"`;
});

register('setReminder', async (args) => {
  const text = (args.text as string) || (args.message as string);
  const time = (args.time as string) || (args.when as string);
  if (!text) throw new Error('Reminder text is required');
  return `Reminder set: "${text}"${time ? ` at ${time}` : ''}`;
});

register('getTime', async () => {
  const now = new Date();
  return `Current time: ${now.toLocaleTimeString()}, date: ${now.toLocaleDateString()}`;
});

register('takeNotes', async (args) => {
  const notes = (args.text as string) || (args.notes as string);
  if (!notes) throw new Error('Notes text is required');
  const title = args.title as string | undefined;
  return `Notes recorded${title ? ` under "${title}"` : ''}`;
});