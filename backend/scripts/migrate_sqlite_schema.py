"""
Safe, Repeatable Schema Migration Script for SQLite.
Adds missing nullable columns to `hospitals` and `patient_profiles` tables
with automatic backup, integrity verification, and idempotency.
"""

import os
import sys
import shutil
import sqlite3
import datetime

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "healthcare_db.db"))

COLUMNS_TO_ADD = {
    "hospitals": [
        ("opening_hours", "TEXT"),
        ("beds", "INTEGER"),
    ],
    "patient_profiles": [
        ("annual_income", "NUMERIC(12, 2)"),
        ("employment_status", "VARCHAR(50)"),
        ("family_size", "INTEGER"),
        ("ration_card_type", "VARCHAR(50)"),
        ("disability_status", "VARCHAR(50)"),
        ("pregnancy_status", "VARCHAR(50)"),
    ],
}


def get_table_columns(conn: sqlite3.Connection, table_name: str) -> list[str]:
    cur = conn.cursor()
    cur.execute(f"PRAGMA table_info({table_name})")
    return [row[1] for row in cur.fetchall()]


def get_table_counts(conn: sqlite3.Connection) -> dict[str, int]:
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    tables = [r[0] for r in cur.fetchall()]
    counts = {}
    for t in tables:
        cur.execute(f"SELECT COUNT(*) FROM {t}")
        counts[t] = cur.fetchone()[0]
    return counts


def run_migration():
    if not os.path.exists(DB_PATH):
        print(f"[ERROR] Database file not found at: {DB_PATH}")
        sys.exit(1)

    print(f"[1] Verified database file: {DB_PATH}")

    # 1. Create Timestamped Backup
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{DB_PATH}.backup_{timestamp}.bak"
    shutil.copy2(DB_PATH, backup_path)
    print(f"[2] Created database backup: {backup_path}")

    # 2. Verify Backup File
    try:
        backup_conn = sqlite3.connect(backup_path)
        check = backup_conn.execute("PRAGMA integrity_check").fetchone()[0]
        backup_conn.close()
        if check != "ok":
            print(f"[ERROR] Backup integrity check failed: {check}")
            sys.exit(1)
        print(f"[3] Backup integrity verified: OK ({os.path.getsize(backup_path)} bytes)")
    except Exception as e:
        print(f"[ERROR] Failed to verify backup: {e}")
        sys.exit(1)

    # 3. Connect to Main Database and Record Initial State
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    before_counts = get_table_counts(conn)
    print("[4] Initial row counts recorded:")
    for tbl, count in before_counts.items():
        print(f"    - {tbl}: {count} rows")

    # 4. Perform Column Additions
    changes_made = []
    for table_name, cols in COLUMNS_TO_ADD.items():
        existing_cols = get_table_columns(conn, table_name)
        for col_name, col_type in cols:
            if col_name not in existing_cols:
                sql = f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type};"
                print(f"[5] Executing: {sql}")
                cur.execute(sql)
                changes_made.append((table_name, col_name, col_type))
            else:
                print(f"[INFO] Column '{table_name}.{col_name}' already exists. Skipping.")

    conn.commit()
    print(f"[6] Applied {len(changes_made)} column additions successfully.")

    # 5. Verification Post-Migration
    after_counts = get_table_counts(conn)
    for tbl, count in before_counts.items():
        assert after_counts[tbl] == count, f"Row count mismatch for {tbl}: was {count}, now {after_counts[tbl]}"
    print("[7] Verified row counts: 100% Preserved.")

    # Check all target columns exist
    for table_name, cols in COLUMNS_TO_ADD.items():
        current_cols = get_table_columns(conn, table_name)
        for col_name, _ in cols:
            assert col_name in current_cols, f"Column {table_name}.{col_name} was not found after migration!"
    print("[8] Verified all 8 target columns are present in database schema.")

    # Check database integrity
    integrity = cur.execute("PRAGMA integrity_check").fetchone()[0]
    assert integrity == "ok", f"Integrity check failed post-migration: {integrity}"
    print("[9] Post-migration integrity check: OK")

    conn.close()
    print("\n================ MIGRATION SUCCESSFUL ================")
    print(f"Backup file: {backup_path}")
    print(f"Changes applied ({len(changes_made)}):")
    for tbl, col, ctype in changes_made:
        print(f"  + {tbl}.{col} ({ctype})")
    print("======================================================")


if __name__ == "__main__":
    run_migration()
