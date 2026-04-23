# Aegis Backend

FastAPI backend for Aegis - The Voice-Activated AI CFO

## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Unix/MacOS:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 5. Run the Server

```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --port 8000
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── main.py                 # Application entry point
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
├── app/
│   ├── models/            # Pydantic schemas
│   │   └── schemas.py
│   ├── routers/           # API endpoints
│   │   ├── health.py      # Health check
│   │   ├── files.py       # File upload/management
│   │   ├── query.py       # Query execution
│   │   └── tts.py         # Text-to-speech
│   ├── services/          # Business logic
│   │   ├── file_processor.py    # File loading
│   │   ├── schema_analyzer.py   # Schema extraction
│   │   ├── auditor.py          # Financial auditing
│   │   ├── code_executor.py    # Secure code sandbox
│   │   └── tts_service.py      # TTS generation
│   └── utils/             # Helper functions
│       └── validators.py
├── uploads/               # Uploaded files (gitignored)
└── temp/                  # Temporary files (gitignored)
```

## Key Features

### 1. Privacy-First Architecture
- Raw data never leaves the backend
- Only schema metadata sent to LLM
- Secure code execution sandbox

### 2. File Processing
- Support for CSV, XLSX, XLS
- Automatic schema extraction
- Financial column detection

### 3. Automated Auditing
- Duplicate transaction detection
- Anomaly/outlier detection
- Missing data validation
- Date inconsistency checks

### 4. Secure Code Execution
- AST-based code allowlisting
- Restricted execution environment
- Only safe Pandas operations

### 5. Text-to-Speech
- Free edge-tts integration
- Multiple voice options
- Streaming audio responses

## API Endpoints

### Health
- `GET /api/health` - Health check

### Files
- `POST /api/files/upload` - Upload financial file
- `GET /api/files/audit/{file_id}` - Run audit on file
- `GET /api/files/list` - List uploaded files
- `DELETE /api/files/{file_id}` - Delete file

### Query
- `POST /api/query/execute` - Execute natural language query
- `POST /api/query/test` - Test query endpoint

### Text-to-Speech
- `POST /api/tts/synthesize` - Convert text to speech
- `GET /api/tts/voices` - List available voices

## Development

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
black app/
```

### Type Checking
```bash
mypy app/
```

## Security Considerations

1. **Code Execution**: Only allowlisted AST nodes and functions
2. **File Uploads**: Size limits and extension validation
3. **Data Privacy**: Schema-only approach for LLM integration
4. **CORS**: Configured for specific frontend origins

## Future Enhancements

- [ ] LLM integration (Claude/Llama)
- [ ] Database for file metadata
- [ ] User authentication
- [ ] Advanced chart generation
- [ ] Multi-file analysis
- [ ] Export functionality
