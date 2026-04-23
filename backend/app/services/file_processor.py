"""
File processing service
Handles loading CSV and Excel files into Pandas DataFrames
"""
import pandas as pd
from typing import Optional

class FileProcessor:
    """Process uploaded financial files"""

    def load_file(self, file_path: str, file_type: str) -> pd.DataFrame:
        """
        Load a file into a Pandas DataFrame

        Args:
            file_path: Path to the file
            file_type: File extension (csv, xlsx, xls)

        Returns:
            Pandas DataFrame
        """
        if file_type == "csv":
            return pd.read_csv(file_path)
        elif file_type in ["xlsx", "xls"]:
            return pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

    def infer_financial_columns(self, df: pd.DataFrame) -> dict:
        """
        Attempt to identify common financial columns

        Returns dict with identified column purposes:
        - date_column
        - amount_column
        - description_column
        - vendor_column
        """
        identified = {}

        # Common patterns for date columns
        date_patterns = ["date", "time", "timestamp", "day", "month", "year"]
        for col in df.columns:
            col_lower = col.lower()
            if any(pattern in col_lower for pattern in date_patterns):
                identified["date_column"] = col
                break

        # Common patterns for amount columns
        amount_patterns = ["amount", "total", "price", "cost", "payment", "salary", "revenue"]
        for col in df.columns:
            col_lower = col.lower()
            if any(pattern in col_lower for pattern in amount_patterns):
                identified["amount_column"] = col
                break

        # Common patterns for description
        desc_patterns = ["description", "desc", "memo", "note", "detail"]
        for col in df.columns:
            col_lower = col.lower()
            if any(pattern in col_lower for pattern in desc_patterns):
                identified["description_column"] = col
                break

        # Common patterns for vendor
        vendor_patterns = ["vendor", "merchant", "payee", "supplier", "company"]
        for col in df.columns:
            col_lower = col.lower()
            if any(pattern in col_lower for pattern in vendor_patterns):
                identified["vendor_column"] = col
                break

        return identified
