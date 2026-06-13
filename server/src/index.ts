/**
 * Nexa Backend Server
 *
 * Express + WebSocket server that proxies real-time audio between the
 * frontend and the Gemini Live API. Handles bidirectional audio streaming
 * and tool call execution.
 *
 * Frontend connects via WebSocket to ws://host/api/live
 */

import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createGeminiSession, executeToolAndRespond } from './gemini.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY environment variable is required.');
  console.error('Create a .env file or set it in your environment.');
  console.error('Get a key at https://aistudio.google.com/apikey');
  process.exit(1);
}

const app = express();

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'nexa-server' });
});

const server = http.createServer(app);

// WebSocket server for /api/live
const wss = new WebSocketServer({ server, path: '/api/live' });

wss.on('connection', (ws: WebSocket) => {
  console.log('[WS] Frontend connected');

  let geminiSession: Awaited<ReturnType<typeof createGeminiSession>> | null = null;
  let sessionActive = false;

  // Handle frontend sending tool responses back
  const pendingToolCalls = new Map<string, { id: string; name: string; args: Record<string, unknown> }>();

  // Send a JSON message to the frontend
  function sendToFrontend(data: Record<string, unknown>): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  // Initialize Gemini session
  async function initGeminiSession(): Promise<void> {
    try {
      geminiSession = await createGeminiSession(GEMINI_API_KEY!, {
        onText: (text: string) => {
          sendToFrontend({ text });
        },
        onAudio: (base64Audio: string, _mimeType: string) => {
          // Forward audio to frontend as base64 encoded PCM16 at 24kHz
          sendToFrontend({ audioData: base64Audio });
        },
        onToolCall: (toolCall: { id: string; name: string; args: Record<string, unknown> }) => {
          console.log(`[Gemini] Tool call: ${toolCall.name}`, toolCall.args);

          // Store pending tool call so frontend can respond if needed
          pendingToolCalls.set(toolCall.id, toolCall);

          // Notify frontend about the tool call
          sendToFrontend({
            toolCall: {
              name: toolCall.name,
              args: toolCall.args,
            },
          });

          // Execute the tool and send results back to Gemini
          executeToolAndRespond(toolCall).then((response) => {
            pendingToolCalls.delete(toolCall.id);
            console.log(`[Tools] ${toolCall.name} result:`, response.response);
            geminiSession?.sendToolResponse([response]);
          });
        },
        onInterrupted: () => {
          console.log('[Gemini] Interrupted');
        },
        onTurnComplete: () => {
          console.log('[Gemini] Turn complete');
        },
        onError: (error: Error) => {
          console.error('[Gemini] Session error:', error);
          sendToFrontend({ error: error.message });
        },
      });

      sessionActive = true;
      console.log('[Gemini] Session initialized');
      sendToFrontend({ text: 'Nexa AI assistant connected' });
    } catch (error) {
      sessionActive = false;
      const message = error instanceof Error ? error.message : String(error);
      console.error('[Gemini] Failed to create session:', message);
      sendToFrontend({ error: `Failed to connect to Gemini: ${message}` });
    }
  }

  // Handle incoming messages from the frontend
  ws.on('message', async (raw: Buffer | ArrayBuffer | Buffer[]) => {
    try {
      const data = JSON.parse(raw.toString());

      // Initialize Gemini session on first message if not already active
      if (!sessionActive) {
        initGeminiSession().catch((err) => {
          console.error('[WS] Session init failed:', err);
        });
      }

      if (data.type === 'audio' && data.data) {
        // Forward audio to Gemini Live API
        if (geminiSession) {
          geminiSession.sendAudio(data.data as string);
        }
      } else if (data.type === 'tool_response') {
        // Handle tool response from frontend (if we want frontend to execute)
        // Currently we execute tools server-side, but this allows for override
        if (geminiSession && data.responses) {
          geminiSession.sendToolResponse(data.responses);
        }
      } else if (data.type === 'setup_complete') {
        // Frontend is ready — Gemini session should be initializing
        if (!sessionActive) {
          initGeminiSession().catch((err) => {
            console.error('[WS] Session init failed:', err);
          });
        }
      }
    } catch (err) {
      console.error('[WS] Failed to parse message:', err);
    }
  });

  // Handle WebSocket close
  ws.on('close', () => {
    console.log('[WS] Frontend disconnected');
    if (geminiSession) {
      geminiSession.close();
      geminiSession = null;
    }
    sessionActive = false;
    pendingToolCalls.clear();
  });

  // Handle WebSocket error
  ws.on('error', (err) => {
    console.error('[WS] Error:', err);
    if (geminiSession) {
      geminiSession.close();
      geminiSession = null;
    }
    sessionActive = false;
  });
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  🚀 Nexa Server running on http://0.0.0.0:${PORT}`);
  console.log(`  📡 WebSocket endpoint: ws://0.0.0.0:${PORT}/api/live`);
  console.log(`  ❤️  Health check: http://0.0.0.0:${PORT}/health\n`);
});