"""
Financial auditor service
Automatically detects anomalies and issues in financial data
"""
import pandas as pd
from datetime import datetime
from typing import List
from app.models.schemas import AuditReport, AuditFinding

class FinancialAuditor:
    """Automated financial data auditor"""

    def audit(self, df: pd.DataFrame, file_id: str) -> AuditReport:
        """
        Run comprehensive audit on financial data

        Checks for:
        - Duplicate transactions
        - Anomalous amounts (outliers)
        - Missing critical fields
        - Date inconsistencies
        """
        findings: List[AuditFinding] = []

        # Check for duplicate transactions
        findings.extend(self._check_duplicates(df))

        # Check for outliers in numeric columns
        findings.extend(self._check_outliers(df))

        # Check for missing values in critical columns
        findings.extend(self._check_missing_values(df))

        # Check for date inconsistencies
        findings.extend(self._check_dates(df))

        return AuditReport(
            file_id=file_id,
            total_findings=len(findings),
            findings=findings,
            timestamp=datetime.utcnow().isoformat()
        )

    def _check_duplicates(self, df: pd.DataFrame) -> List[AuditFinding]:
        """Check for duplicate rows"""
        findings = []

        duplicates = df[df.duplicated(keep=False)]
        if len(duplicates) > 0:
            duplicate_indices = duplicates.index.tolist()
            findings.append(
                AuditFinding(
                    severity="warning",
                    category="duplicate_transaction",
                    message=f"Found {len(duplicates)} duplicate rows",
                    affected_rows=duplicate_indices,
                    details={"count": len(duplicates)}
                )
            )

        return findings

    def _check_outliers(self, df: pd.DataFrame) -> List[AuditFinding]:
        """Check for statistical outliers in numeric columns"""
        findings = []

        numeric_cols = df.select_dtypes(include=['number']).columns

        for col in numeric_cols:
            # Use IQR method for outlier detection
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1

            lower_bound = Q1 - 3 * IQR
            upper_bound = Q3 + 3 * IQR

            outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)]

            if len(outliers) > 0:
                findings.append(
                    AuditFinding(
                        severity="info",
                        category="anomaly",
                        message=f"Column '{col}' has {len(outliers)} outliers",
                        affected_rows=outliers.index.tolist(),
                        details={
                            "column": col,
                            "count": len(outliers),
                            "expected_range": f"{lower_bound:.2f} to {upper_bound:.2f}"
                        }
                    )
                )

        return findings

    def _check_missing_values(self, df: pd.DataFrame) -> List[AuditFinding]:
        """Check for missing values"""
        findings = []

        missing = df.isnull().sum()
        cols_with_missing = missing[missing > 0]

        for col, count in cols_with_missing.items():
            severity = "critical" if count > len(df) * 0.5 else "warning"
            findings.append(
                AuditFinding(
                    severity=severity,
                    category="missing_data",
                    message=f"Column '{col}' has {count} missing values ({count/len(df)*100:.1f}%)",
                    details={"column": col, "missing_count": int(count)}
                )
            )

        return findings

    def _check_dates(self, df: pd.DataFrame) -> List[AuditFinding]:
        """Check for date-related issues"""
        findings = []

        # Look for date columns
        date_cols = df.select_dtypes(include=['datetime64']).columns

        for col in date_cols:
            # Check for future dates
            future_dates = df[df[col] > pd.Timestamp.now()]
            if len(future_dates) > 0:
                findings.append(
                    AuditFinding(
                        severity="warning",
                        category="date_inconsistency",
                        message=f"Column '{col}' contains {len(future_dates)} future dates",
                        affected_rows=future_dates.index.tolist()
                    )
                )

        return findings
