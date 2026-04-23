"""
Validation utilities
"""
import os
from typing import List

ALLOWED_EXTENSIONS = {"csv", "xlsx", "xls"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

def validate_file_extension(filename: str, allowed_extensions: set = ALLOWED_EXTENSIONS) -> bool:
    """Check if file extension is allowed"""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions

def validate_file_size(file_size: int, max_size: int = MAX_FILE_SIZE) -> bool:
    """Check if file size is within limits"""
    return file_size <= max_size

def get_file_extension(filename: str) -> str:
    """Extract file extension"""
    return filename.rsplit(".", 1)[1].lower() if "." in filename else ""
