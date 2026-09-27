import sqlite3

def migrate():
    conn = sqlite3.connect('healthcare_db.db')
    cursor = conn.cursor()
    cursor.execute('PRAGMA table_info(hospitals);')
    cols = [row[1] for row in cursor.fetchall()]
    print('Existing cols in hospitals table:', cols)
    
    needed = [
        ('hospital_type', "VARCHAR(64) DEFAULT 'Private'"),
        ('specialties', "TEXT DEFAULT ''"),
        ('has_emergency_room', "BOOLEAN DEFAULT 1"),
        ('google_maps_url', "TEXT")
    ]
    for col_name, col_type in needed:
        if col_name not in cols:
            print(f'Adding column {col_name}...')
            try:
                cursor.execute(f'ALTER TABLE hospitals ADD COLUMN {col_name} {col_type}')
            except Exception as e:
                print('Error adding:', e)
        else:
            print(f'Column {col_name} already exists.')
            
    conn.commit()
    conn.close()
    print('Migration complete.')

if __name__ == '__main__':
    migrate()
