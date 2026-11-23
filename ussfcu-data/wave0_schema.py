import os
import sys
import psycopg2
from config import DB_DSN

SQL_DIR = os.path.join(os.path.dirname(__file__), '..', 'ussfcu-sql')


def run():
    conn = psycopg2.connect(DB_DSN)
    conn.autocommit = True
    cur = conn.cursor()
    for fname in sorted(f for f in os.listdir(SQL_DIR) if f.endswith('.sql')):
        path = os.path.join(SQL_DIR, fname)
        print(f"Running {fname}...", end=' ', flush=True)
        try:
            cur.execute(open(path).read())
            print("OK")
        except Exception as e:
            print(f"FAILED: {e}")
            sys.exit(1)
    conn.close()
    print("Schema ready.")


if __name__ == '__main__':
    run()
