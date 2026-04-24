"""
Secure code execution service
Executes LLM-generated Pandas code in a sandboxed environment
"""
import ast
import pandas as pd
from typing import Any, Dict

class SecureCodeExecutor:
    """
    Execute Python/Pandas code in a restricted environment
    Uses AST allowlisting to prevent malicious code execution
    """

    # Allowed AST node types
    ALLOWED_NODES = {
        ast.Module,
        ast.Expr,
        ast.Assign,
        ast.AugAssign,
        ast.Name,
        ast.Load,
        ast.Store,
        ast.Attribute,
        ast.Call,
        ast.Constant,
        ast.List,
        ast.Tuple,
        ast.Dict,
        ast.Subscript,
        ast.Index,
        ast.Slice,
        ast.BinOp,
        ast.UnaryOp,
        ast.Compare,
        ast.BoolOp,
        ast.IfExp,
        ast.ListComp,
        ast.DictComp,
        ast.comprehension,
        # Operators
        ast.Add,
        ast.Sub,
        ast.Mult,
        ast.Div,
        ast.Mod,
        ast.Pow,
        ast.Eq,
        ast.NotEq,
        ast.Lt,
        ast.LtE,
        ast.Gt,
        ast.GtE,
        ast.And,
        ast.Or,
        ast.Not,
        ast.In,
        ast.NotIn,
        ast.Is,
        ast.IsNot,
        # Control flow
        ast.For,
        ast.While,
        ast.If,
        ast.Break,
        ast.Continue,
        ast.Pass,
        # Function arguments
        ast.keyword,
        ast.arg,
        ast.arguments,
        # String formatting
        ast.JoinedStr,
        ast.FormattedValue,
    }

    # Allowed function/method names
    ALLOWED_FUNCTIONS = {
        # Pandas DataFrame methods
        "describe", "head", "tail", "info", "sum", "mean", "median",
        "std", "min", "max", "count", "value_counts", "groupby",
        "sort_values", "sort_index", "filter", "query", "loc", "iloc",
        "select_dtypes", "dropna", "fillna", "isna", "notna",
        "astype", "to_datetime", "unique", "nunique",
        # Aggregation
        "agg", "aggregate", "apply", "transform",
        # Common functions
        "len", "str", "int", "float", "bool", "round", "abs",
        "print", "range", "enumerate", "list", "dict", "set", "tuple",
        "min", "max", "sum", "sorted", "reversed",
    }

    def strip_imports(self, code: str) -> str:
        """
        Remove import statements from code since we pre-import everything
        """
        lines = code.split('\n')
        filtered_lines = []

        for line in lines:
            stripped = line.strip()
            # Skip import lines
            if stripped.startswith('import ') or stripped.startswith('from '):
                continue
            filtered_lines.append(line)

        return '\n'.join(filtered_lines)

    def validate_code(self, code: str) -> bool:
        """
        Validate that code doesn't contain dangerous operations
        Uses blacklist approach - blocks only dangerous operations

        Raises:
            ValueError: If code contains disallowed operations
        """
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            raise ValueError(f"Syntax error in code: {e}")

        # Blacklisted operations (dangerous)
        DANGEROUS_OPERATIONS = {
            'open', 'eval', 'exec', 'compile', '__import__',
            'system', 'popen', 'spawn', 'fork',
            'read', 'write', 'remove', 'unlink', 'rmdir',
            'socket', 'connect', 'send', 'recv',
            'subprocess', 'os', 'sys', 'shutil',
        }

        for node in ast.walk(tree):
            # Block dangerous function calls
            if isinstance(node, ast.Call):
                func_name = None
                if isinstance(node.func, ast.Name):
                    func_name = node.func.id
                elif isinstance(node.func, ast.Attribute):
                    func_name = node.func.attr

                if func_name and func_name in DANGEROUS_OPERATIONS:
                    raise ValueError(f"Disallowed dangerous function: {func_name}")

            # Block dangerous attribute access
            if isinstance(node, ast.Attribute):
                if node.attr in DANGEROUS_OPERATIONS:
                    raise ValueError(f"Disallowed dangerous operation: {node.attr}")

        return True

    def execute(self, code: str, df: pd.DataFrame) -> Any:
        """
        Execute validated code on the DataFrame

        Args:
            code: Python code to execute
            df: DataFrame to operate on

        Returns:
            Execution result
        """
        # Strip import statements first
        code = self.strip_imports(code)

        # Validate code
        self.validate_code(code)

        # Create restricted execution environment
        import numpy as np
        from datetime import datetime, timedelta

        safe_globals = {
            "df": df,
            "pd": pd,
            "np": np,
            "datetime": datetime,
            "timedelta": timedelta,
            "__builtins__": {
                "len": len,
                "str": str,
                "int": int,
                "float": float,
                "bool": bool,
                "round": round,
                "abs": abs,
                "min": min,
                "max": max,
                "sum": sum,
                "print": print,
                "range": range,
                "enumerate": enumerate,
                "list": list,
                "dict": dict,
                "set": set,
                "tuple": tuple,
                "sorted": sorted,
                "reversed": reversed,
                "zip": zip,
                "map": map,
                "filter": filter,
                "any": any,
                "all": all,
                "isinstance": isinstance,
                "type": type,
                "hasattr": hasattr,
                "getattr": getattr,
                "ValueError": ValueError,
                "TypeError": TypeError,
                "KeyError": KeyError,
                "IndexError": IndexError,
                "Exception": Exception,
            }
        }

        safe_locals: Dict[str, Any] = {}

        # Execute code and capture output
        import io
        import sys

        output_buffer = io.StringIO()
        old_stdout = sys.stdout

        try:
            sys.stdout = output_buffer
            exec(code, safe_globals, safe_locals)

            # Get captured output
            output = output_buffer.getvalue()

            # Check for RESULT_DATA (chart data) or result variable
            result_value = safe_locals.get("RESULT_DATA") or safe_locals.get("result")

            # Return result dict with output and result variable
            result_data = {
                "output": output if output else None,
                "result": result_value,
                "error": None
            }

            return result_data

        except Exception as e:
            return {
                "output": None,
                "result": None,
                "error": str(e)
            }
        finally:
            sys.stdout = old_stdout
            output_buffer.close()

    def execute_multi(self, code: str, dataframes: Dict[str, pd.DataFrame]) -> Any:
        """Execute code with multiple named DataFrames available"""
        code = self.strip_imports(code)
        self.validate_code(code)

        import numpy as np
        from datetime import datetime, timedelta

        safe_globals = {
            "pd": pd,
            "np": np,
            "datetime": datetime,
            "timedelta": timedelta,
            "__builtins__": {
                "len": len,
                "str": str,
                "int": int,
                "float": float,
                "bool": bool,
                "round": round,
                "abs": abs,
                "min": min,
                "max": max,
                "sum": sum,
                "print": print,
                "range": range,
                "enumerate": enumerate,
                "list": list,
                "dict": dict,
                "set": set,
                "tuple": tuple,
                "sorted": sorted,
                "zip": zip,
                "map": map,
                "filter": filter,
                "any": any,
                "all": all,
                "isinstance": isinstance,
                "type": type,
                "hasattr": hasattr,
                "getattr": getattr,
            }
        }

        for name, frame in dataframes.items():
            safe_globals[name] = frame
        if len(dataframes) == 1:
            safe_globals["df"] = list(dataframes.values())[0]

        safe_locals: Dict[str, Any] = {}

        import io
        import sys

        output_buffer = io.StringIO()
        old_stdout = sys.stdout

        try:
            sys.stdout = output_buffer
            exec(code, safe_globals, safe_locals)
            output = output_buffer.getvalue()
            result_value = safe_locals.get("RESULT_DATA") or safe_locals.get("result")
            return {
                "output": output if output else None,
                "result": result_value,
                "error": None
            }
        except Exception as e:
            return {
                "output": None,
                "result": None,
                "error": str(e)
            }
        finally:
            sys.stdout = old_stdout
            output_buffer.close()

    def format_result(self, result: Any) -> Dict[str, Any]:
        """
        Format execution result for API response

        Converts DataFrames, Series, etc. to JSON-serializable format
        """
        if isinstance(result, pd.DataFrame):
            return {
                "type": "dataframe",
                "data": result.to_dict(orient="records"),
                "columns": result.columns.tolist(),
                "shape": result.shape
            }
        elif isinstance(result, pd.Series):
            return {
                "type": "series",
                "data": result.to_dict(),
                "name": result.name
            }
        elif isinstance(result, (int, float, str, bool)):
            return {
                "type": "scalar",
                "value": result
            }
        else:
            return {
                "type": "unknown",
                "value": str(result)
            }
