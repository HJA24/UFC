import sqlite3
import numpy as np
from typing import Any, Dict, List


def dict_factory(cur: sqlite3.Cursor, row: sqlite3.Row) -> Dict[str, Any]:
    fields = [col[0] for col in cur.description]

    return dict(zip(fields, row))


def list_factory(cur: sqlite3.Cursor, row: sqlite3.Row) -> List:
    return row[0]


def ndarray_factory(cur: sqlite3.Cursor, row: sqlite3.Row, dtype=np.float64) -> np.ndarray:
    buf = row[0]

    return np.frombuffer(buf, dtype=dtype)




