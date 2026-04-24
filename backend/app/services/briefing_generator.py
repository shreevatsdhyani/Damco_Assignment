"""
Executive Briefing Generator
Generates proactive CFO-style briefings on file upload
"""
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, List


class BriefingGenerator:
    """Generates executive-style financial briefings from data"""

    def generate(self, dataframes: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        hour = datetime.now().hour
        if hour < 12:
            greeting = "Good morning"
        elif hour < 17:
            greeting = "Good afternoon"
        else:
            greeting = "Good evening"

        all_metrics = []
        all_risks = []
        summary_parts = []

        for file_id, file_data in dataframes.items():
            df = file_data["dataframe"]
            filename = file_data["filename"]
            metrics = self._extract_metrics(df, filename)
            all_metrics.extend(metrics)
            risks = self._detect_risks(df, filename)
            all_risks.extend(risks)
            summary_parts.append(self._summarize_file(df, filename))

        summary = f"{greeting}. " + " ".join(summary_parts)
        recommendations = self._generate_recommendations(all_metrics, all_risks)

        return {
            "greeting": greeting,
            "summary": summary,
            "key_metrics": all_metrics[:8],
            "risks": all_risks,
            "recommendations": recommendations,
        }

    def _extract_metrics(self, df: pd.DataFrame, filename: str) -> List[Dict[str, Any]]:
        metrics = []
        numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()

        amount_cols = [c for c in numeric_cols if any(
            kw in c.lower() for kw in ["amount", "total", "price", "cost", "payment", "salary", "revenue", "balance", "spend"]
        )]

        if amount_cols:
            for col in amount_cols[:3]:
                total = float(df[col].sum())
                avg = float(df[col].mean())
                metrics.append({
                    "label": f"Total {col.replace('_', ' ').title()}",
                    "value": total,
                    "formatted": f"${total:,.2f}" if total > 100 else f"{total:,.2f}",
                    "sublabel": f"Avg: ${avg:,.2f}" if avg > 100 else f"Avg: {avg:,.2f}",
                    "source": filename,
                })

        metrics.append({
            "label": "Total Records",
            "value": len(df),
            "formatted": f"{len(df):,}",
            "sublabel": f"across {len(df.columns)} columns",
            "source": filename,
        })

        if numeric_cols:
            primary_col = amount_cols[0] if amount_cols else numeric_cols[0]
            q1 = float(df[primary_col].quantile(0.25))
            q3 = float(df[primary_col].quantile(0.75))
            iqr = q3 - q1
            outlier_count = int(((df[primary_col] < q1 - 1.5 * iqr) | (df[primary_col] > q3 + 1.5 * iqr)).sum())
            if outlier_count > 0:
                metrics.append({
                    "label": "Outlier Transactions",
                    "value": outlier_count,
                    "formatted": str(outlier_count),
                    "sublabel": f"in {primary_col}",
                    "source": filename,
                    "status": "warning" if outlier_count < 5 else "critical",
                })

        return metrics

    def _detect_risks(self, df: pd.DataFrame, filename: str) -> List[Dict[str, Any]]:
        risks = []

        duplicates = df.duplicated().sum()
        if duplicates > 0:
            risks.append({
                "severity": "critical" if duplicates > 10 else "warning",
                "title": f"{duplicates} duplicate rows detected",
                "detail": f"Found in {filename}. These could indicate duplicate transactions or data entry errors.",
                "source": filename,
            })

        missing = df.isnull().sum()
        critical_missing = missing[missing > len(df) * 0.1]
        for col, count in critical_missing.items():
            pct = count / len(df) * 100
            risks.append({
                "severity": "critical" if pct > 50 else "warning",
                "title": f"{pct:.0f}% missing data in '{col}'",
                "detail": f"{int(count)} of {len(df)} rows have no value for {col} in {filename}.",
                "source": filename,
            })

        numeric_cols = df.select_dtypes(include=["number"]).columns
        for col in numeric_cols:
            if df[col].std() > df[col].mean() * 3 and df[col].mean() != 0:
                risks.append({
                    "severity": "warning",
                    "title": f"High variance in '{col}'",
                    "detail": f"Standard deviation is {df[col].std():.2f} vs mean {df[col].mean():.2f}. Could indicate irregular transactions.",
                    "source": filename,
                })

        return risks

    def _summarize_file(self, df: pd.DataFrame, filename: str) -> str:
        numeric_cols = df.select_dtypes(include=["number"]).columns
        amount_cols = [c for c in numeric_cols if any(
            kw in c.lower() for kw in ["amount", "total", "price", "cost", "payment", "salary", "revenue"]
        )]

        name = filename.replace(".csv", "").replace(".xlsx", "").replace("_", " ").title()

        if amount_cols:
            col = amount_cols[0]
            total = df[col].sum()
            return f"Your {name} data contains {len(df):,} records with a total {col.replace('_', ' ')} of ${total:,.2f}."
        else:
            return f"Your {name} data contains {len(df):,} records across {len(df.columns)} fields."

    def _generate_recommendations(self, metrics: List, risks: List) -> List[str]:
        recs = []

        critical_risks = [r for r in risks if r["severity"] == "critical"]
        if critical_risks:
            recs.append(f"Address {len(critical_risks)} critical issue(s) immediately — duplicate entries and missing data can lead to incorrect financial reporting.")

        outlier_metrics = [m for m in metrics if m.get("status") in ["warning", "critical"]]
        if outlier_metrics:
            recs.append("Review flagged outlier transactions — these may represent errors, fraud, or legitimate but unusual activity that needs documentation.")

        if not critical_risks and not outlier_metrics:
            recs.append("Your data looks clean. Consider setting up regular automated audits to maintain this quality.")

        recs.append("Ask me specific questions about your data — I can break down spending by category, identify trends, or compare periods.")

        return recs
