import sqlite3

def clean():
    conn = sqlite3.connect('healthcare_db.db')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM hospitals WHERE state != 'Tamil Nadu' OR state IS NULL")
    deleted = cursor.rowcount
    conn.commit()
    cursor.execute("SELECT COUNT(*), state FROM hospitals GROUP BY state")
    rows = cursor.fetchall()
    conn.close()
    print(f"Deleted non-Tamil Nadu records: {deleted}")
    print(f"Remaining records in hospitals table: {rows}")

if __name__ == '__main__':
    clean()
