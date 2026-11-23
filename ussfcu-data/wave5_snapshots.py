"""wave5: snapshot tables built from aggregation — loan_portfolio_snapshot, business_performance_snapshot"""
import uuid
import random
import pandas as pd
import numpy as np
from utils import get_conn, copy_df_to_table, fetch_rows, is_done, mark_done

random.seed(600)


def generate_loan_portfolio_snapshot(conn):
    if is_done('loan_portfolio_snapshot'):
        print("loan_portfolio_snapshot already done, skipping.")
        return
    print("Generating loan_portfolio_snapshot...")

    cur = conn.cursor()
    cur.execute("""
        INSERT INTO loan_portfolio_snapshot (
            snapshot_id, snapshot_date, product_id,
            total_loans, total_balance, avg_balance, avg_rate,
            avg_term_months, delinquency_rate, charge_off_rate,
            modified_loan_count, modified_loan_balance, created_at
        )
        SELECT
            gen_random_uuid(),
            DATE_TRUNC('month', origination_date)::date + INTERVAL '1 month' - INTERVAL '1 day',
            product_id,
            COUNT(*),
            SUM(current_balance),
            AVG(current_balance),
            AVG(interest_rate),
            AVG(term_months),
            SUM(CASE WHEN loan_status='DELINQUENT' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0),
            SUM(CASE WHEN loan_status='CHARGED_OFF' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0),
            SUM(CASE WHEN modified=TRUE THEN 1 ELSE 0 END),
            SUM(CASE WHEN modified=TRUE THEN current_balance ELSE 0 END),
            NOW()
        FROM loan_accounts
        GROUP BY DATE_TRUNC('month', origination_date), product_id
    """)
    conn.commit()
    cur.close()
    mark_done('loan_portfolio_snapshot')
    print("  loan_portfolio_snapshot generated via SQL aggregation")


def generate_business_performance_snapshot(conn):
    if is_done('business_performance_snapshot'):
        print("business_performance_snapshot already done, skipping.")
        return
    print("Generating business_performance_snapshot...")

    months = pd.date_range('2020-01-01', '2026-10-01', freq='MS')
    income_data = fetch_rows(conn,
        "SELECT statement_month, net_interest_income, nim, efficiency_ratio, roa FROM income_statement_monthly ORDER BY statement_month")
    income_map = {str(r['statement_month'])[:7]: r for r in income_data}

    cap_data = fetch_rows(conn,
        "SELECT snapshot_date, total_assets, loan_to_share_ratio, net_worth_ratio FROM capital_liquidity_snapshot ORDER BY snapshot_date")
    cap_map = {str(r['snapshot_date'])[:7]: r for r in cap_data}

    rows = []
    prev_loans = None
    prev_deposits = None

    for month in months:
        mk = month.strftime('%Y-%m')
        date_str = month.date().strftime('%Y-%m-%d')
        yr_frac = (month.year - 2020) + (month.month - 1) / 12

        income = income_map.get(mk, {})
        cap = cap_map.get(mk, {})

        total_members = int(12000 + yr_frac * 150)
        new_members = random.randint(20, 60)
        closed_members = random.randint(2, 15)

        total_loans = round((float(cap.get('total_assets') or 650000000) * 0.65), 2)
        total_deposits = round((float(cap.get('total_assets') or 650000000) * 0.82), 2)
        originations = round(total_loans * random.uniform(0.03, 0.06), 2)

        net_deposit_growth = round(total_deposits - prev_deposits, 2) if prev_deposits else 0.0
        prev_loans = total_loans
        prev_deposits = total_deposits

        nim = float(income.get('nim') or 0.032)
        eff_ratio = float(income.get('efficiency_ratio') or 0.72)
        roa = float(income.get('roa') or 0.009)
        capital_ratio = float(cap.get('net_worth_ratio') or 0.105)

        delinquency = round(random.uniform(0.015, 0.045), 4)
        charge_off = round(random.uniform(0.002, 0.012), 4)
        digital_adopt = round(min(0.72, 0.40 + yr_frac * 0.03), 4)
        compliance_score = round(random.uniform(0.78, 0.92), 4)

        rows.append({
            'snapshot_id': str(uuid.uuid4()),
            'snapshot_date': date_str,
            'period_type': 'MONTHLY',
            'total_members': total_members,
            'new_members_period': new_members,
            'closed_members_period': closed_members,
            'net_member_growth': new_members - closed_members,
            'total_loans_outstanding': total_loans,
            'loan_originations_period': originations,
            'total_deposits': total_deposits,
            'net_deposit_growth': net_deposit_growth,
            'nim': nim,
            'efficiency_ratio': eff_ratio,
            'roa': roa,
            'capital_ratio': capital_ratio,
            'delinquency_rate': delinquency,
            'charge_off_rate': charge_off,
            'compliance_score': compliance_score,
            'digital_adoption_rate': digital_adopt,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'business_performance_snapshot')
    mark_done('business_performance_snapshot')
    print(f"  inserted {len(df)} rows into business_performance_snapshot")


def run():
    conn = get_conn()
    generate_loan_portfolio_snapshot(conn)
    generate_business_performance_snapshot(conn)
    conn.close()
    print("Wave 5 snapshots complete.")


if __name__ == '__main__':
    run()
