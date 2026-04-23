# Aegis Frontend

Next.js frontend for Aegis - The Voice-Activated AI CFO

## Tech Stack

- **Next.js 14** - App Router
- **React 19** - UI framework
- **TypeScript** - Type safety
- **TailwindCSS 4** - Styling
- **react-speech-recognition** - Voice input
- **recharts** - Financial charts
- **lucide-react** - Icons
- **axios** - API client

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
# Edit .env.local with your backend API URL
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/
│   ├── components/          # React components
│   │   ├── FileUploader.tsx     # File upload UI
│   │   ├── FileInfo.tsx         # File details display
│   │   ├── AuditPanel.tsx       # Audit results
│   │   └── ChatInterface.tsx    # Voice chat UI
│   ├── hooks/               # Custom React hooks
│   │   ├── useFileUpload.ts     # File upload logic
│   │   ├── useChat.ts           # Chat functionality
│   │   └── useSpeechRecognition.ts  # Voice input
│   ├── lib/                 # Utilities
│   │   └── api.ts               # API client
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main page
│   └── globals.css          # Global styles
├── public/                  # Static assets
├── package.json
└── README.md
```

## Key Features

### 1. Voice-First Interface
- Browser-native Web Speech API
- No backend required for speech-to-text
- Real-time transcription
- Visual feedback during listening

### 2. File Upload
- Drag-and-drop support
- Progress indication
- File type validation
- Error handling

### 3. Automated Auditing
- Visual severity indicators
- Categorized findings
- Affected row highlighting
- Detailed error information

### 4. Chat Interface
- Message history
- Voice/text input
- Audio playback for responses
- Chart data visualization

### 5. Privacy Dashboard
- Clear privacy guarantees
- Schema-only display
- No raw data exposure

## Components

### FileUploader
Handles file selection via drag-and-drop or file picker. Shows upload progress and errors.

### FileInfo
Displays uploaded file metadata and schema overview without exposing raw data.

### AuditPanel
Shows automated audit findings with severity levels, categories, and details.

### ChatInterface
Voice-first chat interface with speech recognition, message history, and audio responses.

## Custom Hooks

### useFileUpload
Manages file upload state, API calls, and error handling.

### useChat
Handles message state, query execution, and chat history.

### useSpeechRecognition
Wraps browser speech recognition API with React state management.

## API Integration

The frontend communicates with the FastAPI backend via REST API:

- `POST /api/files/upload` - Upload financial file
- `GET /api/files/audit/{file_id}` - Get audit report
- `POST /api/query/execute` - Execute natural language query
- `POST /api/tts/synthesize` - Generate speech audio

See `app/lib/api.ts` for full API client implementation.

## Environment Variables

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Feature flags
NEXT_PUBLIC_ENABLE_VOICE=true
NEXT_PUBLIC_ENABLE_CHARTS=true
```

## Browser Support

### Speech Recognition
- Chrome/Edge: Full support
- Safari: Full support (iOS 14.5+)
- Firefox: Limited support

For best voice experience, use Chrome or Edge.

## Development

### Linting
```bash
npm run lint
```

## Future Enhancements

- [ ] Real-time collaboration
- [ ] Advanced chart types
- [ ] Export functionality
- [ ] Multi-file comparison
- [ ] Custom voice commands
- [ ] Offline mode
- [ ] Mobile app
