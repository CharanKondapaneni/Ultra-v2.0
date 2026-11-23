"""wave4a: loan lifecycle tables — loan_transactions, loan_modifications, loan_delinquency,
charge_off_records, adverse_action_notices"""
import uuid
import random
import pandas as pd
import numpy as np
from utils import get_conn, copy_df_to_table, fetch_rows, is_done, mark_done
from config import SCENARIO_PERIODS

random.seed(1)
np.random.seed(1)

# Build a scenario date map covering 2020-01-01 to 2026-10-31
def _build_scenario_map():
    dr = pd.date_range('2020-01-01', '2026-10-31')
    m = {str(d.date()): None for d in dr}
    for s, e, sp in SCENARIO_PERIODS:
        for d in pd.date_range(s, e):
            k = str(d.date())
            if k in m and m[k] is None:
                m[k] = sp
    return m

SCENARIO_MAP = _build_scenario_map()
SHUTDOWN_DATES = {d for d, sp in SCENARIO_MAP.items() if sp == 'GOVERNMENT_SHUTDOWN'}
COVID_DATES = {d for d, sp in SCENARIO_MAP.items() if sp == 'COVID_EMERGENCY'}


def generate_loan_transactions(conn):
    if is_done('loan_transactions'):
        print("loan_transactions already done, skipping.")
        return
    print("Generating loan_transactions (chunked by 500 loans)...")

    loans = fetch_rows(conn,
        "SELECT loan_id, origination_date, maturity_date, original_balance, interest_rate, term_months, loan_status, monthly_payment "
        "FROM loan_accounts WHERE term_months > 1")

    end_date = pd.Timestamp('2026-10-31')
    batch_size = 500
    total_inserted = 0

    for chunk_start in range(0, len(loans), batch_size):
        chunk = loans[chunk_start:chunk_start + batch_size]
        rows = []
        for loan in chunk:
            loan_id = loan['loan_id']
            orig_dt = pd.Timestamp(str(loan['origination_date']))
            mat_dt = pd.Timestamp(str(loan['maturity_date']))
            gen_end = min(mat_dt, end_date)
            if orig_dt >= gen_end:
                continue

            orig_bal = float(loan['original_balance'] or 0)
            rate = float(loan['interest_rate'] or 5.0)
            term = int(loan['term_months'] or 60)
            monthly_rate = rate / 12 / 100
            monthly_pmt = float(loan['monthly_payment'] or 0)
            if monthly_pmt == 0 and term > 0:
                if monthly_rate > 0:
                    f = (1 + monthly_rate) ** term
                    monthly_pmt = orig_bal * monthly_rate * f / (f - 1)
                else:
                    monthly_pmt = orig_bal / term

            balance = orig_bal
            txn_date = orig_dt + pd.DateOffset(months=1)
            month_num = 0

            while txn_date <= gen_end and balance > 0:
                month_num += 1
                date_str = txn_date.date().strftime('%Y-%m-%d')
                interest_pmt = round(balance * monthly_rate, 2)
                principal_pmt = round(min(monthly_pmt - interest_pmt, balance), 2)
                if principal_pmt < 0:
                    principal_pmt = 0
                actual_pmt = round(interest_pmt + principal_pmt, 2)
                balance = round(max(0, balance - principal_pmt), 2)

                rows.append({
                    'transaction_id': str(uuid.uuid4()),
                    'loan_id': loan_id,
                    'transaction_date': date_str,
                    'transaction_type': 'PAYMENT',
                    'amount': actual_pmt,
                    'principal_portion': principal_pmt,
                    'interest_portion': interest_pmt,
                    'fee_portion': None,
                    'escrow_portion': None,
                    'running_balance': balance,
                })

                # Late fee for delinquent/default loans occasionally
                if loan['loan_status'] in ('DELINQUENT','DEFAULT') and random.random() < 0.1:
                    rows.append({
                        'transaction_id': str(uuid.uuid4()),
                        'loan_id': loan_id,
                        'transaction_date': date_str,
                        'transaction_type': 'FEE',
                        'amount': 35.00,
                        'principal_portion': None,
                        'interest_portion': None,
                        'fee_portion': 35.00,
                        'escrow_portion': None,
                        'running_balance': balance,
                    })

                txn_date += pd.DateOffset(months=1)

            # Payoff transaction for paid-off loans
            if loan['loan_status'] == 'PAID_OFF' and balance > 0:
                rows.append({
                    'transaction_id': str(uuid.uuid4()),
                    'loan_id': loan_id,
                    'transaction_date': gen_end.date().strftime('%Y-%m-%d'),
                    'transaction_type': 'PAYOFF',
                    'amount': balance,
                    'principal_portion': balance,
                    'interest_portion': 0,
                    'fee_portion': None,
                    'escrow_portion': None,
                    'running_balance': 0,
                })

            # Charge-off transaction
            if loan['loan_status'] == 'CHARGED_OFF':
                rows.append({
                    'transaction_id': str(uuid.uuid4()),
                    'loan_id': loan_id,
                    'transaction_date': gen_end.date().strftime('%Y-%m-%d'),
                    'transaction_type': 'CHARGE_OFF',
                    'amount': balance,
                    'principal_portion': balance,
                    'interest_portion': 0,
                    'fee_portion': None,
                    'escrow_portion': None,
                    'running_balance': 0,
                })

        if rows:
            df = pd.DataFrame(rows)
            copy_df_to_table(conn, df, 'loan_transactions')
            total_inserted += len(rows)
            print(f"  ...inserted {total_inserted} loan_transactions so far")

    mark_done('loan_transactions')
    print(f"  loan_transactions done: {total_inserted} total rows")


def generate_loan_modifications(conn):
    if is_done('loan_modifications'):
        print("loan_modifications already done, skipping.")
        return
    print("Generating loan_modifications...")

    loans = fetch_rows(conn,
        "SELECT loan_id, interest_rate, term_months, monthly_payment, loan_status FROM loan_accounts WHERE loan_status IN ('MODIFIED','CURRENT','DELINQUENT')")
    if not loans:
        mark_done('loan_modifications')
        return

    staff_ids = [r['staff_id'] for r in fetch_rows(conn, "SELECT staff_id FROM staff WHERE department='Lending' LIMIT 10")]

    months = pd.date_range('2020-01-01', '2026-10-31', freq='MS')
    mod_types = ['PAYMENT_DEFERRAL','RATE_REDUCTION','TERM_EXTENSION','COMBINATION','PRINCIPAL_FORGIVENESS']
    mod_weights = [0.45, 0.30, 0.15, 0.08, 0.02]
    hardship_map = {
        'COVID_EMERGENCY': 'COVID_HARDSHIP',
        'GOVERNMENT_SHUTDOWN': 'GOVERNMENT_SHUTDOWN_HARDSHIP',
    }

    rows = []
    for month in months:
        date_str = month.date().strftime('%Y-%m-%d')
        sp = SCENARIO_MAP.get(date_str)
        base_count = 25
        if sp == 'COVID_EMERGENCY':
            count = int(base_count * 10.0)
            mod_type_weights = [0.70, 0.15, 0.08, 0.05, 0.02]
        else:
            count = base_count
            mod_type_weights = mod_weights

        count = min(count, len(loans))
        hardship = hardship_map.get(sp, 'GENERAL_HARDSHIP')

        for _ in range(count):
            loan = random.choice(loans)
            orig_rate = float(loan['interest_rate'] or 5.0)
            orig_term = int(loan['term_months'] or 60)
            orig_pmt = float(loan['monthly_payment'] or 500)
            mod_type = np.random.choice(mod_types, p=mod_type_weights)

            post_rate = round(orig_rate - random.uniform(0.5, 2.0), 4) if mod_type in ('RATE_REDUCTION','COMBINATION') else orig_rate
            post_term = orig_term + random.randint(12, 60) if mod_type in ('TERM_EXTENSION','COMBINATION') else orig_term
            post_pmt = round(orig_pmt * random.uniform(0.70, 0.90), 2) if mod_type == 'PAYMENT_DEFERRAL' else orig_pmt

            rows.append({
                'modification_id': str(uuid.uuid4()),
                'loan_id': loan['loan_id'],
                'modification_date': date_str,
                'modification_type': mod_type,
                'pre_mod_rate': orig_rate,
                'post_mod_rate': post_rate,
                'pre_mod_term': orig_term,
                'post_mod_term': post_term,
                'pre_mod_payment': orig_pmt,
                'post_mod_payment': post_pmt,
                'hardship_reason': hardship,
                'approved_by': random.choice(staff_ids) if staff_ids else None,
                'effective_date': date_str,
            })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'loan_modifications')
    mark_done('loan_modifications')
    print(f"  inserted {len(df)} rows into loan_modifications")


def generate_loan_delinquency(conn):
    if is_done('loan_delinquency'):
        print("loan_delinquency already done, skipping.")
        return
    print("Generating loan_delinquency...")

    loans = fetch_rows(conn,
        "SELECT loan_id, origination_date, loan_status, current_balance FROM loan_accounts WHERE loan_status IN ('DELINQUENT','DEFAULT','MODIFIED','CHARGED_OFF')")
    all_loan_ids = [r['loan_id'] for r in fetch_rows(conn, "SELECT loan_id FROM loan_accounts")]

    months = pd.date_range('2020-01-01', '2026-10-31', freq='MS')
    buckets = ['30DPD','60DPD','90DPD','120DPD','180DPD_PLUS']
    bucket_weights = [0.60, 0.25, 0.10, 0.04, 0.01]
    collection_map = {
        '30DPD': 'SOFT_LETTER',
        '60DPD': 'HARD_LETTER',
        '90DPD': 'CALL',
        '120DPD': 'LEGAL',
        '180DPD_PLUS': 'CHARGE_OFF_PENDING',
    }

    rows = []
    for month in months:
        date_str = month.date().strftime('%Y-%m-%d')
        sp = SCENARIO_MAP.get(date_str)
        base_rate = 0.025
        if sp == 'COVID_EMERGENCY':
            base_rate *= 0.6
        elif sp == 'POST_PANDEMIC_NORMALIZATION':
            base_rate *= 1.9
        elif sp == 'GOVERNMENT_SHUTDOWN':
            base_rate *= 1.6

        # Sample loans to be delinquent this month
        n_delinquent = int(len(all_loan_ids) * base_rate)
        n_delinquent = min(n_delinquent, len(loans))
        if n_delinquent == 0:
            continue

        sample = random.sample(loans, min(n_delinquent, len(loans)))
        is_shutdown = sp == 'GOVERNMENT_SHUTDOWN'
        is_covid = sp == 'COVID_EMERGENCY'

        for loan in sample:
            bucket = np.random.choice(buckets, p=bucket_weights)
            dpd_map = {'30DPD': 35, '60DPD': 65, '90DPD': 95, '120DPD': 125, '180DPD_PLUS': 185}
            dpd = dpd_map[bucket] + random.randint(-5, 5)
            bal = float(loan['current_balance'] or 5000)

            rows.append({
                'delinquency_id': str(uuid.uuid4()),
                'loan_id': loan['loan_id'],
                'as_of_date': date_str,
                'days_past_due': dpd,
                'delinquency_bucket': bucket,
                'delinquent_balance': round(bal, 2),
                'delinquent_principal': round(bal * 0.90, 2),
                'delinquent_interest': round(bal * 0.10, 2),
                'hardship_flag': is_covid and random.random() < 0.4,
                'government_shutdown_related': is_shutdown,
                'collection_status': collection_map.get(bucket, 'NONE'),
            })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'loan_delinquency')
    mark_done('loan_delinquency')
    print(f"  inserted {len(df)} rows into loan_delinquency")


def generate_charge_off_records(conn):
    if is_done('charge_off_records'):
        print("charge_off_records already done, skipping.")
        return
    print("Generating charge_off_records...")

    loans = fetch_rows(conn,
        "SELECT l.loan_id, l.member_id, l.current_balance, l.origination_date FROM loan_accounts l WHERE l.loan_status='CHARGED_OFF'")
    if not loans:
        # Generate some from non-charged-off loans too to reach ~450 rows
        loans = fetch_rows(conn, "SELECT loan_id, member_id, current_balance, origination_date FROM loan_accounts LIMIT 450")

    reasons = ['insufficient_funds','bankruptcy','extended_delinquency','fraud','other']
    reason_weights = [0.40, 0.25, 0.20, 0.10, 0.05]

    rows = []
    dates = pd.date_range('2020-01-01', '2026-10-31', periods=min(450, len(loans)))
    # Peak in 2021 - double density
    extra_2021 = pd.date_range('2021-06-01', '2022-03-31', periods=min(100, len(loans) // 4))

    all_dates = sorted(list(dates) + list(extra_2021))

    for i, dt in enumerate(all_dates[:min(450, len(loans))]):
        loan = loans[i % len(loans)]
        bal = max(500, float(loan['current_balance'] or 5000))
        recovery = round(bal * random.uniform(0.15, 0.35), 2)
        rows.append({
            'charge_off_id': str(uuid.uuid4()),
            'loan_id': loan['loan_id'],
            'member_id': loan['member_id'],
            'charge_off_date': dt.date().strftime('%Y-%m-%d'),
            'charge_off_amount': round(bal, 2),
            'charge_off_principal': round(bal * 0.88, 2),
            'charge_off_interest': round(bal * 0.10, 2),
            'charge_off_fees': round(bal * 0.02, 2),
            'recovery_amount': recovery,
            'net_charge_off': round(bal - recovery, 2),
            'charge_off_reason': np.random.choice(reasons, p=reason_weights),
            'collection_agency_assigned': random.random() < 0.6,
            'bankruptcy_filed': random.random() < 0.25,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'charge_off_records')
    mark_done('charge_off_records')
    print(f"  inserted {len(df)} rows into charge_off_records")


def generate_adverse_action_notices(conn):
    if is_done('adverse_action_notices'):
        print("adverse_action_notices already done, skipping.")
        return
    print("Generating adverse_action_notices...")

    apps = fetch_rows(conn,
        "SELECT application_id, member_id, decision_date FROM loan_applications WHERE application_status='DENIED'")
    staff_ids = [r['staff_id'] for r in fetch_rows(conn, "SELECT staff_id FROM staff LIMIT 20")]

    denial_reasons_pool = [
        'Credit score below minimum', 'Debt-to-income ratio too high',
        'Insufficient income', 'Derogatory credit history',
        'Insufficient collateral', 'Employment instability'
    ]
    denial_codes_pool = ['DR01','DR02','DR03','DR04','DR05','DR06']

    rows = []
    for a in apps:
        dec_date = str(a['decision_date'])
        try:
            generated_dt = pd.Timestamp(dec_date)
        except Exception:
            continue
        required_dt = generated_dt + pd.Timedelta(days=30)
        timely = random.random() < 0.95
        if timely:
            mail_dt = generated_dt + pd.Timedelta(days=random.randint(10, 30))
        else:
            mail_dt = required_dt + pd.Timedelta(days=random.randint(1, 10))

        n_reasons = random.randint(1, 3)
        reasons = random.sample(denial_reasons_pool, n_reasons)
        codes = random.sample(denial_codes_pool, n_reasons)

        rows.append({
            'notice_id': str(uuid.uuid4()),
            'application_id': a['application_id'],
            'member_id': a['member_id'],
            'notice_type': 'DENIAL',
            'generated_date': generated_dt.date().strftime('%Y-%m-%d'),
            'required_mail_date': required_dt.date().strftime('%Y-%m-%d'),
            'actual_mail_date': mail_dt.date().strftime('%Y-%m-%d'),
            'days_to_mail': (mail_dt - generated_dt).days,
            'timely': timely,
            'denial_reasons': '{' + ','.join(f'"{r}"' for r in reasons) + '}',
            'denial_reason_codes': '{' + ','.join(codes) + '}',
            'mailed_by': random.choice(staff_ids) if staff_ids else None,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'adverse_action_notices')
    mark_done('adverse_action_notices')
    print(f"  inserted {len(df)} rows into adverse_action_notices")


def run():
    conn = get_conn()
    generate_loan_transactions(conn)
    generate_loan_modifications(conn)
    generate_loan_delinquency(conn)
    generate_charge_off_records(conn)
    generate_adverse_action_notices(conn)
    conn.close()
    print("Wave 4a loan events complete.")


if __name__ == '__main__':
    run()
