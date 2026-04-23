"""
Pydantic models for request/response schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class FileType(str, Enum):
    """Supported file types"""
    CSV = "csv"
    XLSX = "xlsx"
    XLS = "xls"

class ColumnInfo(BaseModel):
    """Schema information for a single column"""
    name: str
    dtype: str
    non_null_count: int
    unique_count: int
    sample_values: List[Any]
    min_value: Optional[Any] = None
    max_value: Optional[Any] = None
    mean_value: Optional[float] = None

class FileSchema(BaseModel):
    """Extracted schema from uploaded file"""
    file_id: str
    filename: str
    row_count: int
    column_count: int
    columns: List[ColumnInfo]
    file_type: FileType

    class Config:
        json_encoders = {
            # Ensure all types can be serialized
            Any: lambda v: str(v) if not isinstance(v, (str, int, float, bool, type(None))) else v
        }

class AuditFinding(BaseModel):
    """Single audit finding"""
    severity: str = Field(..., description="critical, warning, or info")
    category: str = Field(..., description="duplicate_payment, anomaly, etc.")
    message: str
    affected_rows: List[int] = Field(default_factory=list)
    details: Optional[Dict[str, Any]] = None

class AuditReport(BaseModel):
    """Complete audit report for a file"""
    file_id: str
    total_findings: int
    findings: List[AuditFinding]
    timestamp: str

class QueryRequest(BaseModel):
    """Request to query financial data"""
    file_id: str
    question: str
    voice_enabled: bool = False

class ChartData(BaseModel):
    """Chart data for visualization"""
    type: str = Field(..., description="Chart type: bar, line, or pie")
    data: List[Dict[str, Any]] = Field(..., description="Chart data points")

class QueryResponse(BaseModel):
    """Response from data query"""
    answer: str
    generated_code: Optional[str] = None
    chart_data: Optional[ChartData] = None
    audio_url: Optional[str] = None
    artifact_html: Optional[str] = None

class TTSRequest(BaseModel):
    """Text-to-speech request"""
    text: str
    voice: str = "en-US-AriaNeural"

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    uptime: float
