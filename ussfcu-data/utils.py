import psycopg2
import psycopg2.extras
import pandas as pd
import numpy as np
import json
import os
from io import StringIO
from config import DB_DSN, SCENARIO_MODIFIERS


def get_conn():
    return psycopg2.connect(DB_DSN)


def copy_df_to_table(conn, df: pd.DataFrame, table_name: str):
    buffer = StringIO()
    df.to_csv(buffer, index=False, header=False, na_rep='\\N')
    buffer.seek(0)
    with conn.cursor() as cur:
        cur.copy_from(buffer, table_name, sep=',', null='\\N', columns=list(df.columns))
    conn.commit()


def fetch_ids(conn, table: str, id_col: str, where: str = None) -> list:
    sql = f"SELECT {id_col} FROM {table}"
    if where:
        sql += f" WHERE {where}"
    with conn.cursor() as cur:
        cur.execute(sql)
        return [row[0] for row in cur.fetchall()]


def fetch_rows(conn, sql: str) -> list:
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(sql)
        return [dict(r) for r in cur.fetchall()]


def load_fiscal_calendar(conn) -> dict:
    rows = fetch_rows(conn, "SELECT fiscal_date, special_period, government_shutdown FROM fiscal_calendar")
    return {str(r['fiscal_date']): r for r in rows}


def get_scenario_modifier(fiscal_map: dict, date_str: str, key: str, default: float = 1.0) -> float:
    row = fiscal_map.get(date_str, {})
    sp = row.get('special_period')
    if sp and sp in SCENARIO_MODIFIERS:
        return SCENARIO_MODIFIERS[sp].get(key, default)
    return default


PROGRESS_FILE = os.path.join(os.path.dirname(__file__), "wave4_progress.json")


def load_progress() -> dict:
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            return json.load(f)
    return {}


def save_progress(progress: dict):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)


def mark_done(table: str):
    p = load_progress()
    p[table] = "done"
    save_progress(p)


def is_done(table: str) -> bool:
    return load_progress().get(table) == "done"


def random_dates(start: str, end: str, n: int) -> np.ndarray:
    s = pd.Timestamp(start).value
    e = pd.Timestamp(end).value
    return pd.to_datetime(np.random.randint(s, e, n)).strftime('%Y-%m-%d')


def weighted_choice(options: list, weights: list, n: int) -> np.ndarray:
    return np.random.choice(options, size=n, p=weights)


def build_scenario_date_map(start: str, end: str) -> dict:
    """Return {date_str: special_period} for every date in range, based on SCENARIO_PERIODS."""
    from config import SCENARIO_PERIODS
    date_range = pd.date_range(start, end)
    result = {str(d.date()): None for d in date_range}
    for s, e, sp in SCENARIO_PERIODS:
        for d in pd.date_range(s, e):
            key = str(d.date())
            if key in result:
                result[key] = sp
    return result
