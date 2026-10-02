import sqlite3
import sys
import os
sys.path.insert(0, os.path.abspath("."))
from app.core.database import Base
import app.models.user
import app.models.profile
import app.models.hospital
import app.models.scheme
import app.models.conversation
import app.models.prediction
import app.models.record
import app.models.document

def run_inspection():
    conn = sqlite3.connect("healthcare_db.db")
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in cur.fetchall()]
    db_tables = {}
    for t in tables:
        db_tables[t] = [c[1] for c in cur.execute(f"PRAGMA table_info({t})").fetchall()]

    print("=================== SCHEMA COMPARISON ===================")
    for t, tbl in Base.metadata.tables.items():
        in_db = t in db_tables
        model_cols = set(tbl.columns.keys())
        db_cols = set(db_tables.get(t, []))
        missing = sorted(list(model_cols - db_cols))
        extra = sorted(list(db_cols - model_cols))
        print(f"\nTable: {t} (Exists in DB: {in_db})")
        if missing:
            print(f"  [MISSING IN SQLITE DB]: {missing}")
        if extra:
            print(f"  [EXTRA IN SQLITE DB]: {extra}")
        if not missing and not extra and in_db:
            print(f"  [STATUS]: Fully Synced ({len(model_cols)} columns)")

    # Inspect record counts
    print("\n=================== RECORD COUNTS ===================")
    for t in tables:
        if not t.startswith("sqlite_"):
            count = cur.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
            print(f"Table '{t}': {count} rows")

if __name__ == "__main__":
    run_inspection()
