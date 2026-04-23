# AEGIS - AI Financial Intelligence Dashboard

> Voice-powered financial analysis platform with natural language querying, smart chart generation, and real-time speech interaction.

![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black) ![FastAPI](https://img.shields.io/badge/FastAPI-Latest-teal) ![Python](https://img.shields.io/badge/Python-3.11+-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

---

## 🚀 Features

### 🧠 AI-Powered Analysis
- Natural language querying with GPT-4o
- Context-aware question suggestions
- Smart chart type selection (bar, line, pie, histogram, horizontal bar)
- Automatic data insights generation

### 🎤 Voice Interaction
- Real-time speech-to-text transcription
- Text-to-speech responses
- Hands-free operation
- Auto-submit after 2 seconds of silence

### 📊 Intelligent Visualizations
- AI-selected chart types based on data patterns
- Interactive Chart.js dashboards
- Time series detection
- Distribution analysis
- Percentage data recognition

### 💼 Financial Data Support
- CSV and Excel file upload
- Multi-file analysis
- Budget vs Actuals
- AR Aging Reports
- Payroll Analysis
- General Ledger
- Cash Flow Tracking

---

## 🏗️ Architecture

```
aegis/
├── frontend/                 # Next.js 16 (App Router)
│   ├── app/
│   │   ├── page.tsx           # Landing page (/)
│   │   ├── dashboard/         # Main dashboard (/dashboard)
│   │   ├── components/        # React components
│   │   ├── lib/              # VoiceContext, utilities
│   │   └── utils/            # Chart selector, suggestions
│   ├── public/
│   └── package.json
│
└── backend/                  # FastAPI Python
    ├── app/
    │   ├── routers/          # API endpoints
    │   ├── services/         # Business logic (OpenAI integration)
    │   ├── models/           # Data schemas
    │   └── main.py           # FastAPI app
    ├── uploads/              # User uploaded files (gitignored)
    ├── requirements.txt
    └── .env                  # OpenAI API key (not in repo)
```

---

## 📦 Installation

### Prerequisites
- **Node.js** 18+ (for frontend)
- **Python** 3.11+ (for backend)
- **OpenAI API Key** (for GPT-4o) - Get one at https://platform.openai.com/api-keys

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/aegis-dashboard.git
cd aegis-dashboard
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your OpenAI API key
echo "OPENAI_API_KEY=sk-your_actual_key_here" > .env

# Run backend server
uvicorn app.main:app --reload --port 8000
```

✅ Backend running at: `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

✅ Frontend running at: `http://localhost:3000`

---

## 🎮 Usage

### 1. Access the Application
- Navigate to `http://localhost:3000`
- Click **"Launch Aegis"** on the landing page

### 2. Upload Financial Data
- Click **"Upload Files"** or drag & drop
- Supported formats: **CSV, XLSX, XLS**
- Multiple files can be uploaded simultaneously

### 3. Ask Questions

**Type Mode:**
- Enter questions in the chat input
- Press Enter to submit

**Voice Mode:**
- Click microphone button 🎤
- Speak your question clearly
- Stop speaking → auto-submits after 2 seconds

**Example Questions:**
- "What is the total revenue?"
- "Show me departments over budget"
- "Break down spending by category"
- "Which customers have outstanding invoices?"

### 4. Review Insights
- AI generates smart charts automatically
- View interactive dashboards in right panel
- Click **"Read aloud"** to hear responses
- Use suggested follow-up questions

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16.2.4 (App Router, Turbopack)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS
- **Charts**: Recharts, Chart.js
- **Voice**: Web Speech API (native browser)
- **HTTP Client**: Axios
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (async)
- **Language**: Python 3.11+
- **AI**: OpenAI GPT-4o
- **Data Processing**: Pandas, NumPy
- **File Parsing**: openpyxl (Excel), csv
- **CORS**: FastAPI middleware

---

## 🎨 Design System

### Color Palette
Cyber Military Intelligence Theme inspired by secure government dashboards:

- **Primary (Cyber Lime)**: `#bfff00`
- **Background (Deep Black)**: `#0a0d12`
- **Surface (Dark Slate)**: `#141b26`
- **Border (Steel Blue)**: `#2d3748`
- **Text (Off-White)**: `#e8ecf1`
- **Muted (Gray)**: `#8b92a1`

### Typography
- **Font Family**: Inter (system font stack)
- **Headings**: Bold, uppercase
- **Body**: Regular, 14-16px
- **Monospace**: Consolas (for data)

---

## 🔧 Configuration

### Environment Variables

**Backend** (`backend/.env`):
```env
OPENAI_API_KEY=sk-your_actual_openai_api_key_here
OPENAI_MODEL=gpt-4o
```

⚠️ **IMPORTANT**: Never commit `.env` files to Git!

---

## 📝 API Endpoints

### File Management
- `POST /files/upload` - Upload CSV/Excel file
- `GET /files/list` - List all uploaded files
- `DELETE /files/{file_id}` - Delete specific file

### AI Chat
- `POST /chat/query` - Send question, receive answer + chart data

### Health Check
- `GET /health` - Check API status
- `GET /docs` - Swagger API documentation

---

## 🚢 Deployment

### Option 1: Vercel (Frontend) + Render (Backend)

**Frontend (Vercel):**
```bash
cd frontend
npm run build
vercel deploy --prod
```

**Backend (Render):**
1. Create new Web Service
2. Connect your GitHub repo
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variable: `OPENAI_API_KEY=sk-...`

### Option 2: Docker (Both)

```bash
# Build and run with Docker Compose
docker-compose up --build
```

---

## 🧪 Testing

### Frontend
```bash
cd frontend
npm run build        # Production build test
npm run lint         # ESLint check
```

### Backend
```bash
cd backend
pytest tests/        # Run unit tests
```

---

## 📚 Key Features Explained

### 1. Smart Chart Selection Algorithm
The system automatically selects optimal chart types using pattern detection:

- **Line Chart**: Time series data, trends, forecasts
- **Bar Chart**: Category comparisons, discrete values
- **Pie Chart**: Proportions, percentages (≤ 8 segments)
- **Histogram**: Distributions, frequency analysis
- **Horizontal Bar**: Long category labels, rankings

### 2. Real-Time Speech Recognition
- Uses Web Speech API (native browser)
- Displays interim results as you speak
- Prevents text duplication with `lastResultIndex` tracking
- Auto-submits after 2 seconds of silence
- Works in Chrome, Edge, Safari (not Firefox)

### 3. Question Suggestion Engine
- **Initial suggestions**: Based on uploaded file schemas
- **Follow-up suggestions**: Based on conversation context
- **Cross-domain suggestions**: Diverse question paths
- **Similarity filtering**: Avoids repetitive suggestions

---

## 🐛 Troubleshooting

### Speech Recognition Not Working
**Issue**: Microphone button doesn't activate
**Solutions**:
- Use Chrome, Edge, or Safari (Firefox unsupported)
- Check browser microphone permissions
- Ensure HTTPS (required for production)

### Backend Connection Errors
**Issue**: Frontend can't reach backend
**Solutions**:
- Verify backend is running on port 8000
- Check CORS settings in `backend/app/main.py`
- Ensure frontend API URL is correct

### OpenAI API Errors
**Issue**: "Invalid API key" or rate limit errors
**Solutions**:
- Verify API key in `backend/.env`
- Check OpenAI account has credits
- Confirm model `gpt-4o` is accessible

### File Upload Fails
**Issue**: Upload returns error
**Solutions**:
- Check file size (limit: 10MB)
- Ensure format is CSV, XLSX, or XLS
- Verify `backend/uploads/` folder exists
- Check file has valid column headers

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Author

**Shreevats Dhyani**

---

## 🙏 Acknowledgments

- OpenAI for GPT-4o capabilities
- Next.js team for excellent framework
- FastAPI for blazing-fast Python backend
- Chart.js & Recharts for beautiful visualizations
- Web Speech API for native browser voice support

---

## 📞 Support

For issues, questions, or feature requests:
- 🐛 Open an issue on GitHub
- 📧 Email: [your-email@example.com]
- 💬 Discussion forum: GitHub Discussions

---

**Built with 💚 using Claude Code**
