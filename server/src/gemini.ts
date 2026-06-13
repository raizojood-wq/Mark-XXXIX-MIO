/**
 * Gemini Live API client using @google/genai.
 * Handles real-time bidirectional audio streaming with the Gemini model.
 */

import { GoogleGenAI } from '@google/genai';
import type { LiveServerMessage } from '@google/genai';
import { getToolDefinitions, executeTool } from './tools.js';

// Re-export types that callers need
export type { LiveServerMessage };

export interface GeminiSessionCallbacks {
  /** Called when a text response is received from Gemini */
  onText?: (text: string) => void;
  /** Called when audio data is received (base64-encoded PCM16 at 24kHz) */
  onAudio?: (base64Audio: string, mimeType: string) => void;
  /** Called when Gemini requests a tool execution */
  onToolCall?: (toolCall: { id: string; name: string; args: Record<string, unknown> }) => void;
  /** Called when the session is interrupted (e.g., new user input coming in) */
  onInterrupted?: () => void;
  /** Called when the turn is complete */
  onTurnComplete?: () => void;
  /** Called on connection error */
  onError?: (error: Error) => void;
}

export interface GeminiSession {
  /** Send realtime audio input (base64-encoded PCM16 at 16kHz) */
  sendAudio(base64Audio: string): void;
  /** Send a tool response back to Gemini */
  sendToolResponse(functionResponses: Array<{ id: string; name: string; response: Record<string, unknown> }>): void;
  /** Close the session */
  close(): void;
}

/**
 * Create a connection to the Gemini Live API.
 *
 * @param apiKey - Gemini API key
 * @param callbacks - Event callbacks for the session
 * @returns A GeminiSession for sending audio and tool responses
 */
export async function createGeminiSession(
  apiKey: string,
  callbacks: GeminiSessionCallbacks
): Promise<GeminiSession> {
  const toolDefs = getToolDefinitions();

  const ai = new GoogleGenAI({ apiKey });

  const session = await ai.live.connect({
    model: 'gemini-2.0-flash-live-preview-04-09',
    config: {
      responseModalities: ['audio' as any],
      tools: toolDefs,
      systemInstruction: `You are Nexa, an elite AI executive agent. You help high-performance operators with productivity, decision support, and execution.

You speak concisely and authoritatively. Keep responses short and actionable.

You have access to tools. Use them when appropriate:
- openWebsite: Open a URL in the user's browser
- searchGoogle: Search Google
- openYouTube: Open YouTube search
- createTask: Create a task
- setReminder: Set a reminder
- getTime: Get current time and date
- takeNotes: Record notes`,
    },
    callbacks: {
      onopen: () => {
        console.log('[Gemini Live] Connection established');
      },
      onmessage: (message: LiveServerMessage) => {
        handleGeminiMessage(message, callbacks);
      },
      onerror: (event: any) => {
        const error = event?.error ? new Error(event.error.message || String(event.error)) : new Error('Gemini WebSocket error');
        console.error('[Gemini Live] Error:', error);
        callbacks.onError?.(error);
      },
      onclose: (event: any) => {
        console.log('[Gemini Live] Connection closed:', event?.code, event?.reason);
      },
    },
  });

  return {
    sendAudio: (base64Audio: string) => {
      try {
        // Send base64 audio directly to Gemini - @google/genai's Blob type
        // expects { data: base64_string, mimeType: string }
        session.sendRealtimeInput({
          media: {
            data: base64Audio,
            mimeType: 'audio/pcm;rate=16000',
          },
        });
      } catch (err) {
        console.error('[Gemini] Failed to send audio:', err);
      }
    },
    sendToolResponse: (
      functionResponses: Array<{ id: string; name: string; response: Record<string, unknown> }>
    ) => {
      try {
        session.sendToolResponse({
          functionResponses: functionResponses.map((fr) => ({
            id: fr.id,
            name: fr.name,
            response: fr.response,
          })),
        });
      } catch (err) {
        console.error('[Gemini] Failed to send tool response:', err);
      }
    },
    close: () => {
      try {
        session.close();
      } catch (err) {
        console.error('[Gemini] Error closing session:', err);
      }
    },
  };
}

/**
 * Handle incoming messages from the Gemini Live API.
 */
function handleGeminiMessage(
  message: LiveServerMessage,
  callbacks: GeminiSessionCallbacks
): void {
  // Handle server content (model responses)
  if (message.serverContent) {
    const content = message.serverContent;

    // Check for interruption
    if (content.interrupted) {
      callbacks.onInterrupted?.();
      return;
    }

    // Check for turn completion
    if (content.turnComplete) {
      callbacks.onTurnComplete?.();
    }

    // Extract text and audio from model turn
    if (content.modelTurn?.parts) {
      for (const part of content.modelTurn.parts) {
        if (part.text) {
          callbacks.onText?.(part.text);
        }
        if (part.inlineData) {
          const inlineData = part.inlineData as { data?: string; mimeType?: string };
          if (inlineData.data) {
            callbacks.onAudio?.(inlineData.data, inlineData.mimeType || 'audio/pcm');
          }
        }
      }
    }
  }

  // Handle tool calls
  if (message.toolCall?.functionCalls) {
    for (const fc of message.toolCall.functionCalls) {
      if (fc.name && fc.id) {
        callbacks.onToolCall?.({
          id: fc.id,
          name: fc.name,
          args: (fc.args as Record<string, unknown>) || {},
        });
      }
    }
  }

  // Handle tool call cancellations
  if (message.toolCallCancellation?.ids) {
    console.log('[Gemini] Tool calls cancelled:', message.toolCallCancellation.ids);
  }
}

/**
 * Execute a tool and return the result in the format Gemini expects.
 */
export async function executeToolAndRespond(
  toolCall: { id: string; name: string; args: Record<string, unknown> }
): Promise<{ id: string; name: string; response: Record<string, unknown> }> {
  try {
    const result = await executeTool(toolCall.name, toolCall.args);
    return {
      id: toolCall.id,
      name: toolCall.name,
      response: { output: result },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      id: toolCall.id,
      name: toolCall.name,
      response: { error: message },
    };
  }
}