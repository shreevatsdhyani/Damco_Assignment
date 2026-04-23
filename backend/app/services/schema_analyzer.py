"""
Schema analysis service
Extracts metadata from DataFrames WITHOUT exposing raw data
"""
import pandas as pd
from typing import List, Any
from app.models.schemas import FileSchema, ColumnInfo, FileType

class SchemaAnalyzer:
    """Extract schema information from financial data"""

    def extract_schema(
        self,
        df: pd.DataFrame,
        file_id: str,
        filename: str,
        file_type: str
    ) -> FileSchema:
        """
        Extract schema-only information from DataFrame

        PRIVACY: Only extracts structure, types, and stats.
        NO raw data values are included (only samples for type inference).
        """
        columns = []

        for col in df.columns:
            col_info = self._analyze_column(df[col])
            columns.append(col_info)

        return FileSchema(
            file_id=file_id,
            filename=filename,
            row_count=len(df),
            column_count=len(df.columns),
            columns=columns,
            file_type=FileType(file_type)
        )

    def _sanitize_value(self, value: Any) -> Any:
        """Sanitize value for JSON serialization"""
        import math
        import numpy as np

        # Handle NaN, Inf
        if isinstance(value, (float, np.floating)):
            if math.isnan(value) or math.isinf(value):
                return None
            return float(value)

        # Handle numpy types
        if isinstance(value, (np.integer, np.int64, np.int32)):
            return int(value)

        # Handle timestamps
        if isinstance(value, pd.Timestamp):
            return value.isoformat()

        # Convert to string if all else fails
        try:
            return str(value) if value is not None else None
        except:
            return None

    def _analyze_column(self, series: pd.Series) -> ColumnInfo:
        """Analyze a single column"""
        dtype_str = str(series.dtype)

        # Get sample values (only first 3 unique values for type inference)
        unique_vals = series.dropna().unique()
        sample_values = [
            self._sanitize_value(v)
            for v in unique_vals[:3].tolist()
        ] if len(unique_vals) > 0 else []

        # Basic stats
        col_info = ColumnInfo(
            name=str(series.name),  # Ensure name is string
            dtype=dtype_str,
            non_null_count=int(series.count()),
            unique_count=int(series.nunique()),
            sample_values=sample_values
        )

        # Numeric statistics
        if pd.api.types.is_numeric_dtype(series):
            try:
                min_val = series.min()
                max_val = series.max()
                mean_val = series.mean()

                col_info.min_value = self._sanitize_value(min_val) if not series.empty else None
                col_info.max_value = self._sanitize_value(max_val) if not series.empty else None
                col_info.mean_value = self._sanitize_value(mean_val) if not series.empty else None
            except:
                # Skip stats if there's an error
                pass

        return col_info

    def generate_schema_prompt(self, schema: FileSchema) -> str:
        """
        Generate a natural language description of the schema
        This is what gets sent to the LLM (NOT the raw data)
        """
        prompt = f"""
Financial Dataset Schema:
- Filename: {schema.filename}
- Rows: {schema.row_count:,}
- Columns: {schema.column_count}

Column Details:
"""
        for col in schema.columns:
            prompt += f"\n{col.name}:"
            prompt += f"\n  Type: {col.dtype}"
            prompt += f"\n  Non-null: {col.non_null_count:,}"
            prompt += f"\n  Unique values: {col.unique_count:,}"

            if col.min_value is not None:
                prompt += f"\n  Range: {col.min_value} to {col.max_value}"
                prompt += f"\n  Mean: {col.mean_value:.2f}"

            prompt += f"\n  Sample: {col.sample_values[:3]}"

        return prompt
