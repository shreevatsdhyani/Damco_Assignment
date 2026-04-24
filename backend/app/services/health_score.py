"""
Financial Health Score Calculator
Computes a composite health score (0-100) from uploaded data
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List


class HealthScoreCalculator:
    """Calculates a composite financial health score"""

    def calculate(self, dataframes: Dict[str, Dict[str, Any]], audit_results: Dict[str, Any] = None) -> Dict[str, Any]:
        scores = {}
        alerts = []

        completeness = self._score_completeness(dataframes)
        scores["data_completeness"] = completeness["score"]
        alerts.extend(completeness.get("alerts", []))

        consistency = self._score_consistency(dataframes)
        scores["data_consistency"] = consistency["score"]
        alerts.extend(consistency.get("alerts", []))

        anomaly = self._score_anomaly_level(dataframes)
        scores["anomaly_level"] = anomaly["score"]
        alerts.extend(anomaly.get("alerts", []))

        coverage = self._score_coverage(dataframes)
        scores["data_coverage"] = coverage["score"]
        alerts.extend(coverage.get("alerts", []))

        weights = {
            "data_completeness": 0.30,
            "data_consistency": 0.25,
            "anomaly_level": 0.30,
            "data_coverage": 0.15,
        }
        total_score = int(sum(scores[k] * weights[k] for k in scores))
        total_score = max(0, min(100, total_score))

        if total_score >= 90:
            grade = "A"
        elif total_score >= 80:
            grade = "B"
        elif total_score >= 70:
            grade = "C"
        elif total_score >= 60:
            grade = "D"
        else:
            grade = "F"

        return {
            "score": total_score,
            "grade": grade,
            "breakdown": {
                k: {"score": v, "weight": weights[k], "label": k.replace("_", " ").title()}
                for k, v in scores.items()
            },
            "alerts": sorted(alerts, key=lambda x: {"critical": 0, "warning": 1, "info": 2}.get(x.get("severity", "info"), 3)),
        }

    def _score_completeness(self, dataframes: Dict) -> Dict:
        total_cells = 0
        filled_cells = 0
        alerts = []

        for file_id, file_data in dataframes.items():
            df = file_data["dataframe"]
            cells = df.shape[0] * df.shape[1]
            filled = int(df.notna().sum().sum())
            total_cells += cells
            filled_cells += filled

            missing_pct = (1 - filled / cells) * 100 if cells > 0 else 0
            if missing_pct > 20:
                alerts.append({
                    "severity": "critical",
                    "message": f"{file_data['filename']} has {missing_pct:.0f}% missing data",
                    "category": "completeness",
                })
            elif missing_pct > 5:
                alerts.append({
                    "severity": "warning",
                    "message": f"{file_data['filename']} has {missing_pct:.0f}% missing data",
                    "category": "completeness",
                })

        score = int((filled_cells / total_cells * 100)) if total_cells > 0 else 0
        return {"score": score, "alerts": alerts}

    def _score_consistency(self, dataframes: Dict) -> Dict:
        issues = 0
        total_checks = 0
        alerts = []

        for file_id, file_data in dataframes.items():
            df = file_data["dataframe"]

            dup_count = df.duplicated().sum()
            total_checks += len(df)
            issues += dup_count
            if dup_count > 0:
                alerts.append({
                    "severity": "warning",
                    "message": f"{dup_count} duplicate rows in {file_data['filename']}",
                    "category": "consistency",
                })

            for col in df.select_dtypes(include=["object"]).columns:
                unique_ratio = df[col].nunique() / len(df) if len(df) > 0 else 0
                if unique_ratio > 0.95 and len(df) > 10:
                    total_checks += 1

        score = max(0, int(100 - (issues / max(total_checks, 1)) * 100))
        return {"score": score, "alerts": alerts}

    def _score_anomaly_level(self, dataframes: Dict) -> Dict:
        total_values = 0
        anomaly_count = 0
        alerts = []

        for file_id, file_data in dataframes.items():
            df = file_data["dataframe"]
            numeric_cols = df.select_dtypes(include=["number"]).columns

            for col in numeric_cols:
                q1 = df[col].quantile(0.25)
                q3 = df[col].quantile(0.75)
                iqr = q3 - q1
                outliers = ((df[col] < q1 - 2 * iqr) | (df[col] > q3 + 2 * iqr)).sum()
                total_values += len(df)
                anomaly_count += outliers

                if outliers > len(df) * 0.05:
                    alerts.append({
                        "severity": "warning",
                        "message": f"{int(outliers)} anomalous values in '{col}' ({file_data['filename']})",
                        "category": "anomaly",
                    })

        anomaly_pct = anomaly_count / max(total_values, 1) * 100
        score = max(0, int(100 - anomaly_pct * 10))
        return {"score": score, "alerts": alerts}

    def _score_coverage(self, dataframes: Dict) -> Dict:
        alerts = []
        if len(dataframes) == 0:
            return {"score": 0, "alerts": [{"severity": "info", "message": "No data uploaded", "category": "coverage"}]}

        total_cols = 0
        useful_cols = 0

        for file_id, file_data in dataframes.items():
            df = file_data["dataframe"]
            total_cols += len(df.columns)
            for col in df.columns:
                if df[col].notna().sum() > len(df) * 0.5:
                    useful_cols += 1

        score = int(useful_cols / max(total_cols, 1) * 100)
        if score < 70:
            alerts.append({
                "severity": "info",
                "message": f"Only {useful_cols}/{total_cols} columns have >50% data",
                "category": "coverage",
            })
        return {"score": score, "alerts": alerts}
