# Mark-XXXIX-MIO

Nexa — a premium, real-time voice-to-voice AI executive agent.

## Getting Started

### Frontend (React + Vite)

```bash
npm install
npm run dev
```

### Backend (Node.js + TypeScript)

```bash
cd server
npm install
npm run dev
```

The backend requires a `GEMINI_API_KEY` environment variable. Copy `.env.example` to `.env` and add your key.

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS, served on port 5173
- **Backend**: Node.js + Express + WebSocket, running on port 3001
- **AI**: Gemini Live API (`gemini-2.0-flash-live-preview-04-09`) for real-time voice interaction
- **Audio**: Bidirectional PCM16 audio streaming via WebSocket proxy