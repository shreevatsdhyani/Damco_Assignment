"""
File upload and management endpoints
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import uuid
import os

from app.models.schemas import FileSchema, AuditReport
from app.services.file_processor import FileProcessor
from app.services.schema_analyzer import SchemaAnalyzer
from app.services.auditor import FinancialAuditor

router = APIRouter()

# In-memory storage for demo (replace with database in production)
uploaded_files = {}

@router.post("/upload", response_model=FileSchema)
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a single financial file (CSV, XLSX)
    Returns the extracted schema
    """
    # Validate file extension
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in ["csv", "xlsx", "xls"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Allowed: csv, xlsx, xls"
        )

    # Generate unique file ID
    file_id = str(uuid.uuid4())

    # Save file temporarily
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{file_id}_{file.filename}")

    # Read and save file
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Process file and extract schema
    try:
        processor = FileProcessor()
        df = processor.load_file(file_path, file_ext)

        analyzer = SchemaAnalyzer()
        schema = analyzer.extract_schema(df, file_id, file.filename, file_ext)

        # Store file metadata
        uploaded_files[file_id] = {
            "path": file_path,
            "filename": file.filename,
            "schema": schema,
            "dataframe": df
        }

        return schema

    except Exception as e:
        # Clean up on error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"File processing error: {str(e)}")

@router.get("/audit/{file_id}", response_model=AuditReport)
async def audit_file(file_id: str):
    """
    Run automated audit on uploaded file
    Returns audit findings
    """
    if file_id not in uploaded_files:
        raise HTTPException(status_code=404, detail="File not found")

    df = uploaded_files[file_id]["dataframe"]

    auditor = FinancialAuditor()
    audit_report = auditor.audit(df, file_id)

    return audit_report

@router.get("/list")
async def list_files():
    """List all uploaded files"""
    return [
        {
            "file_id": fid,
            "filename": data["filename"],
            "row_count": data["schema"].row_count,
            "column_count": data["schema"].column_count
        }
        for fid, data in uploaded_files.items()
    ]

@router.post("/upload-multiple", response_model=List[FileSchema])
async def upload_multiple_files(files: List[UploadFile] = File(...)):
    """
    Upload multiple financial files at once
    Returns a list of extracted schemas
    """
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="No files provided")

    results = []
    errors = []

    for file in files:
        # Validate file extension
        file_ext = file.filename.split(".")[-1].lower()
        if file_ext not in ["csv", "xlsx", "xls"]:
            errors.append(f"{file.filename}: Unsupported file type")
            continue

        # Generate unique file ID
        file_id = str(uuid.uuid4())

        # Save file temporarily
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, f"{file_id}_{file.filename}")

        try:
            # Read and save file
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)

            # Process file and extract schema
            processor = FileProcessor()
            df = processor.load_file(file_path, file_ext)

            analyzer = SchemaAnalyzer()
            schema = analyzer.extract_schema(df, file_id, file.filename, file_ext)

            # Store file metadata
            uploaded_files[file_id] = {
                "path": file_path,
                "filename": file.filename,
                "schema": schema,
                "dataframe": df
            }

            results.append(schema)

        except Exception as e:
            # Clean up on error
            if os.path.exists(file_path):
                os.remove(file_path)
            errors.append(f"{file.filename}: {str(e)}")

    # Return results if we have any successes
    if results:
        return results

    # If no successes, return the errors
    if errors:
        raise HTTPException(status_code=400, detail=f"All uploads failed: {'; '.join(errors)}")

    # Should never reach here, but just in case
    raise HTTPException(status_code=400, detail="No files were processed")

@router.delete("/{file_id}")
async def delete_file(file_id: str):
    """Delete an uploaded file"""
    if file_id not in uploaded_files:
        raise HTTPException(status_code=404, detail="File not found")

    # Remove file from disk
    file_path = uploaded_files[file_id]["path"]
    if os.path.exists(file_path):
        os.remove(file_path)

    # Remove from memory
    del uploaded_files[file_id]

    return {"message": "File deleted successfully"}
