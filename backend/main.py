"""
Aegis Backend - Voice-Activated AI CFO
Main FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

from app.routers import files, query, tts, health

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Aegis API",
    description="Voice-Activated AI CFO - Privacy-First Financial Analysis",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(files.router, prefix="/api/files", tags=["Files"])
app.include_router(query.router, prefix="/api/query", tags=["Query"])
app.include_router(tts.router, prefix="/api/tts", tags=["Text-to-Speech"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Aegis API - Voice-Activated AI CFO",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if os.getenv("DEBUG") == "True" else "An error occurred"
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "True") == "True"
    )
