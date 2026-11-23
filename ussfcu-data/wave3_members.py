import uuid
import random
import pandas as pd
import numpy as np
from faker import Faker
from utils import get_conn, copy_df_to_table, fetch_rows, is_done, mark_done
from config import TOTAL_MEMBERS, SEG_DISTRIBUTION, LOAN_MIX

fake = Faker()
Faker.seed(99)
random.seed(99)
np.random.seed(99)


def generate_members(conn):
    if is_done('members'):
        print("members already done, skipping.")
        return
    print(f"Generating {TOTAL_MEMBERS} members...")

    segs = fetch_rows(conn, "SELECT seg_id, seg_type FROM seg_groups WHERE seg_type IN ('SENATE','HOUSE','CONTRACTOR','RETIREE','MILITARY')")
    # Pick one seg per type
    seg_by_type = {}
    for s in segs:
        if s['seg_type'] not in seg_by_type:
            seg_by_type[s['seg_type']] = s['seg_id']

    branches = fetch_rows(conn, "SELECT branch_id, region FROM branches")
    branch_ids = [b['branch_id'] for b in branches]

    employers = fetch_rows(conn, "SELECT employer_id, name FROM employers")
    emp_map = {e['name']: e['employer_id'] for e in employers}

    state_by_region = {'Metro DC': 'DC', 'Northern VA': 'VA', 'Maryland': 'MD'}
    zip_by_region = {'Metro DC': '20001', 'Northern VA': '22201', 'Maryland': '20850'}

    seg_type_list = list(SEG_DISTRIBUTION.keys())
    seg_weights = list(SEG_DISTRIBUTION.values())

    rows = []
    for i in range(TOTAL_MEMBERS):
        seg_type = np.random.choice(seg_type_list, p=seg_weights)
        seg_id = seg_by_type.get(seg_type)
        membership_date = fake.date_between(start_date='-18y', end_date='today').strftime('%Y-%m-%d')
        yr = int(membership_date[:4])

        # Digital enrollment grows from 40% in 2020 to 72% in 2026
        if yr < 2020:
            digital_prob = 0.35
        else:
            digital_prob = min(0.72, 0.40 + (yr - 2020) * 0.03)

        if seg_type == 'MILITARY':
            mil_status = np.random.choice(['ACTIVE_DUTY','RESERVE','VETERAN','CIVILIAN'], p=[0.60,0.20,0.15,0.05])
        else:
            mil_status = np.random.choice(['CIVILIAN','VETERAN'], p=[0.95,0.05])

        status = np.random.choice(['ACTIVE','INACTIVE','CLOSED','SUSPENDED'], p=[0.94,0.03,0.02,0.01])
        branch = random.choice(branches)
        state = state_by_region.get(branch['region'], 'DC')
        zip_code = zip_by_region.get(branch['region'], '20001')

        rows.append({
            'member_id': str(uuid.uuid4()),
            'member_number': f'MBR{100000+i:06d}',
            'employer_id': None,
            'seg_id': seg_id,
            'branch_id': branch['branch_id'],
            'first_name': fake.first_name(),
            'last_name': fake.last_name(),
            'date_of_birth': fake.date_of_birth(minimum_age=18, maximum_age=75).strftime('%Y-%m-%d'),
            'ssn_hash': fake.md5(),
            'membership_date': membership_date,
            'membership_type': np.random.choice(['PRIMARY','JOINT','BUSINESS'], p=[0.85,0.12,0.03]),
            'status': status,
            'military_status': mil_status,
            'state': state,
            'zip': zip_code,
            'digital_enrolled': random.random() < digital_prob,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'members')
    mark_done('members')
    print(f"  inserted {len(df)} rows into members")


def generate_loan_applications(conn):
    if is_done('loan_applications'):
        print("loan_applications already done, skipping.")
        return
    print("Generating loan_applications...")

    members = fetch_rows(conn, "SELECT member_id, seg_id, military_status FROM members WHERE status='ACTIVE'")
    segs = fetch_rows(conn, "SELECT seg_id, seg_type FROM seg_groups")
    seg_type_map = {s['seg_id']: s['seg_type'] for s in segs}

    products = fetch_rows(conn, "SELECT product_id, product_code, product_category, is_hmda_reportable FROM loan_products")
    prod_by_code = {p['product_code']: p for p in products}

    los = fetch_rows(conn, "SELECT lo_id FROM loan_officers")
    lo_ids = [l['lo_id'] for l in los]

    branches = fetch_rows(conn, "SELECT branch_id FROM branches")
    branch_ids = [b['branch_id'] for b in branches]

    # Map product categories to product_codes
    cat_to_codes = {}
    for p in products:
        cat = p['product_category']
        if cat not in cat_to_codes:
            cat_to_codes[cat] = []
        cat_to_codes[cat].append(p['product_id'])

    n_apps = 18000
    dates = pd.date_range('2020-01-01', '2026-10-31', periods=n_apps)

    race_opts = ['White','Black or African American','Asian','American Indian or Alaska Native','Native Hawaiian']
    race_weights = [0.62, 0.13, 0.10, 0.03, 0.02]
    ethnicity_opts = ['Not Hispanic or Latino', 'Hispanic or Latino']
    eth_weights = [0.88, 0.12]
    sex_opts = ['Male','Female']
    sex_weights = [0.52, 0.48]
    status_opts = ['APPROVED','DENIED','WITHDRAWN','INCOMPLETE']
    status_weights = [0.65, 0.20, 0.10, 0.05]
    denial_reasons = ['Credit Score Too Low','Insufficient Income','High DTI Ratio',
                      'Insufficient Collateral','Incomplete Application','Employment History']

    # Category weights matching LOAN_MIX
    cat_list = ['MORTGAGE','AUTO','PERSONAL','HELOC','CREDIT_CARD']
    cat_weights = [LOAN_MIX['MORTGAGE'],LOAN_MIX['AUTO'],LOAN_MIX['PERSONAL'],LOAN_MIX['HELOC'],LOAN_MIX['CREDIT_CARD']]

    rows = []
    for i, dt in enumerate(dates):
        member = random.choice(members)
        cat = np.random.choice(cat_list, p=cat_weights)
        prod_ids = cat_to_codes.get(cat, [])
        if not prod_ids:
            continue
        prod_id = random.choice(prod_ids)
        prod = next((p for p in products if p['product_id'] == prod_id), None)

        status = np.random.choice(status_opts, p=status_weights)
        app_date = dt.date().strftime('%Y-%m-%d')
        decision_days = random.randint(3, 30)
        decision_date = (dt + pd.Timedelta(days=decision_days)).date().strftime('%Y-%m-%d')

        income = round(random.uniform(45000, 220000), 2)
        credit_score = random.randint(560, 820)
        dti = round(random.uniform(0.18, 0.55), 4)
        ltv = round(random.uniform(0.60, 0.97), 4) if cat in ('MORTGAGE','HELOC') else None
        is_hmda = prod['is_hmda_reportable'] if prod else False

        rows.append({
            'application_id': str(uuid.uuid4()),
            'member_id': member['member_id'],
            'lo_id': random.choice(lo_ids),
            'product_id': prod_id,
            'application_date': app_date,
            'application_amount': round(random.uniform(5000, 500000), 2) if cat in ('MORTGAGE','HELOC') else round(random.uniform(1000, 50000), 2),
            'application_status': status,
            'denial_reason': random.choice(denial_reasons) if status == 'DENIED' else None,
            'denial_reason_code': f'DR{random.randint(1,6):02d}' if status == 'DENIED' else None,
            'decision_date': decision_date,
            'decisioning_days': decision_days,
            'branch_id': random.choice(branch_ids),
            'hmda_reportable': is_hmda,
            'race': np.random.choice(race_opts, p=race_weights) if is_hmda else None,
            'ethnicity': np.random.choice(ethnicity_opts, p=eth_weights) if is_hmda else None,
            'sex': np.random.choice(sex_opts, p=sex_weights) if is_hmda else None,
            'income': income,
            'dti_ratio': dti,
            'ltv_ratio': ltv,
            'credit_score': credit_score,
            'purpose_code': '1' if cat == 'MORTGAGE' else '5',
            'occupancy_type': 'PRINCIPAL_RESIDENCE' if cat in ('MORTGAGE','HELOC') else None,
            'property_type': 'SINGLE_FAMILY' if cat in ('MORTGAGE','HELOC') else None,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'loan_applications')
    mark_done('loan_applications')
    print(f"  inserted {len(df)} rows into loan_applications")


def generate_loan_accounts(conn):
    if is_done('loan_accounts'):
        print("loan_accounts already done, skipping.")
        return
    print("Generating loan_accounts...")

    apps = fetch_rows(conn,
        "SELECT a.application_id, a.member_id, a.product_id, a.application_date, a.lo_id, a.branch_id "
        "FROM loan_applications a WHERE a.application_status='APPROVED'")
    members = fetch_rows(conn, "SELECT member_id, seg_id, military_status FROM members")
    segs = fetch_rows(conn, "SELECT seg_id, seg_type FROM seg_groups")
    seg_type_map = {s['seg_id']: s['seg_type'] for s in segs}
    mem_map = {m['member_id']: m for m in members}

    products = fetch_rows(conn, "SELECT product_id, product_category, rate_index, rate_spread, max_term_months, is_mla_covered FROM loan_products")
    prod_map = {p['product_id']: p for p in products}

    # Rate environment for rate lookup
    rates = fetch_rows(conn, "SELECT rate_date, fed_funds_rate, prime_rate, sofr_rate FROM rate_environment ORDER BY rate_date")
    # Build monthly rate map
    rate_by_month = {}
    for r in rates:
        mk = str(r['rate_date'])[:7]
        rate_by_month[mk] = r

    status_opts = ['CURRENT','DELINQUENT','DEFAULT','CHARGED_OFF','PAID_OFF','MODIFIED']
    status_weights = [0.73, 0.07, 0.01, 0.02, 0.12, 0.05]

    rows = []
    for a in apps:
        prod = prod_map.get(a['product_id'])
        if not prod:
            continue
        orig_date = str(a['application_date'])
        month_key = orig_date[:7]
        rate_row = rate_by_month.get(month_key) or rates[0]

        index_rate = 0.0
        if prod['rate_index'] == 'PRIME':
            index_rate = float(rate_row['prime_rate'] or 4.5)
        elif prod['rate_index'] == 'SOFR':
            index_rate = float(rate_row['sofr_rate'] or 1.0)
        else:
            index_rate = float(rate_row['fed_funds_rate'] or 1.75)

        spread = float(prod['rate_spread'] or 2.0)
        interest_rate = round(index_rate + spread, 4)
        term = int(prod['max_term_months'] or 60)
        if prod['product_category'] in ('CREDIT_CARD',):
            term = 1

        orig_dt = pd.Timestamp(orig_date)
        maturity_dt = orig_dt + pd.DateOffset(months=term)

        balance_ranges = {
            'MORTGAGE': (80000, 650000),
            'AUTO': (5000, 55000),
            'PERSONAL': (1000, 35000),
            'HELOC': (15000, 200000),
            'CREDIT_CARD': (500, 15000),
            'BUSINESS': (15000, 300000),
        }
        bal_range = balance_ranges.get(prod['product_category'], (1000, 50000))
        orig_bal = round(random.uniform(*bal_range), 2)

        # Estimate current balance based on time elapsed
        months_elapsed = max(0, (pd.Timestamp('2026-10-31') - orig_dt).days // 30)
        if term > 1 and months_elapsed > 0:
            monthly_rate = interest_rate / 12 / 100
            if monthly_rate > 0:
                factor = (1 + monthly_rate) ** term
                payment = orig_bal * monthly_rate * factor / (factor - 1)
                remaining = min(term, months_elapsed)
                curr_bal = max(0, orig_bal * (((1 + monthly_rate) ** term - (1 + monthly_rate) ** remaining) / ((1 + monthly_rate) ** term - 1)))
            else:
                curr_bal = orig_bal * max(0, (term - months_elapsed) / term)
        else:
            curr_bal = orig_bal

        # Monthly payment
        if term > 1:
            monthly_rate = interest_rate / 12 / 100
            if monthly_rate > 0 and term > 0:
                f = (1 + monthly_rate) ** term
                monthly_pmt = round(orig_bal * monthly_rate * f / (f - 1), 2)
            else:
                monthly_pmt = round(orig_bal / term, 2)
        else:
            monthly_pmt = None

        loan_status = np.random.choice(status_opts, p=status_weights)
        # Old loans mostly paid off
        if months_elapsed > term * 0.9 and random.random() < 0.7:
            loan_status = 'PAID_OFF'
            curr_bal = 0.0

        member = mem_map.get(a['member_id'], {})
        seg_type = seg_type_map.get(member.get('seg_id'))
        is_military = seg_type == 'MILITARY'
        is_active_duty = member.get('military_status') == 'ACTIVE_DUTY'

        rows.append({
            'loan_id': str(uuid.uuid4()),
            'application_id': a['application_id'],
            'member_id': a['member_id'],
            'lo_id': a['lo_id'],
            'product_id': a['product_id'],
            'branch_id': a['branch_id'],
            'origination_date': orig_date,
            'maturity_date': maturity_dt.date().strftime('%Y-%m-%d'),
            'original_balance': orig_bal,
            'current_balance': round(curr_bal, 2),
            'interest_rate': interest_rate,
            'rate_type': 'FIXED' if prod['product_category'] not in ('HELOC',) else 'VARIABLE',
            'term_months': term,
            'monthly_payment': monthly_pmt,
            'next_payment_date': '2026-11-15',
            'loan_status': loan_status,
            'days_past_due': random.randint(30, 180) if loan_status in ('DELINQUENT','DEFAULT') else 0,
            'mla_covered': bool(prod['is_mla_covered'] and is_military),
            'scra_protected': bool(is_active_duty),
            'modified': loan_status == 'MODIFIED',
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'loan_accounts')
    mark_done('loan_accounts')
    print(f"  inserted {len(df)} rows into loan_accounts")


def generate_share_accounts(conn):
    if is_done('share_accounts'):
        print("share_accounts already done, skipping.")
        return
    print("Generating share_accounts (~22k rows)...")

    members = fetch_rows(conn, "SELECT member_id, membership_date, branch_id, digital_enrolled FROM members WHERE status IN ('ACTIVE','INACTIVE')")
    products = fetch_rows(conn, "SELECT product_id, product_code, product_category FROM share_products")
    prod_by_cat = {}
    for p in products:
        cat = p['product_category']
        if cat not in prod_by_cat:
            prod_by_cat[cat] = []
        prod_by_cat[cat].append(p)

    rows = []
    acct_num = 1000000
    for m in members:
        n_accts = random.randint(1, 3)
        mem_date = str(m['membership_date'])
        # Always give a checking account
        cats_to_assign = ['CHECKING']
        if n_accts >= 2:
            cats_to_assign.append(random.choice(['SAVINGS','MONEY_MARKET']))
        if n_accts >= 3:
            cats_to_assign.append(random.choice(['CERTIFICATE','IRA']))

        for cat in cats_to_assign:
            prods = prod_by_cat.get(cat, [])
            if not prods:
                continue
            prod = random.choice(prods)
            opened_date = mem_date
            status = np.random.choice(['ACTIVE','DORMANT','CLOSED'], p=[0.92,0.05,0.03])
            closed_date = None
            if status == 'CLOSED':
                closed_date = fake.date_between(start_date=opened_date, end_date='today').strftime('%Y-%m-%d')

            # Balance by category
            bal_ranges = {
                'CHECKING': (200, 12000),
                'SAVINGS': (500, 45000),
                'MONEY_MARKET': (2000, 80000),
                'CERTIFICATE': (5000, 120000),
                'IRA': (1000, 80000),
            }
            bal = round(random.uniform(*bal_ranges.get(cat, (200, 12000))), 2)
            if status != 'ACTIVE':
                bal = 0.0

            # Maturity for certificates
            term_months = None
            maturity_date = None
            if cat == 'CERTIFICATE':
                term_months = random.choice([12, 24, 36])
                open_dt = pd.Timestamp(opened_date)
                maturity_date = (open_dt + pd.DateOffset(months=term_months)).date().strftime('%Y-%m-%d')

            div_rate = float(prod['dividend_rate'] or 0.001)

            rows.append({
                'account_id': str(uuid.uuid4()),
                'member_id': m['member_id'],
                'product_id': prod['product_id'],
                'branch_id': m['branch_id'],
                'account_number': f'SA{acct_num:08d}',
                'opened_date': opened_date,
                'closed_date': closed_date,
                'current_balance': bal,
                'available_balance': bal,
                'minimum_balance': float(prod.get('min_balance') or 0),
                'dividend_rate': div_rate,
                'apy': div_rate,
                'account_status': status,
                'autopay_source': random.random() < 0.3,
                'direct_deposit': random.random() < 0.4 if cat == 'CHECKING' else False,
                'digital_enrolled': m['digital_enrolled'],
                'maturity_date': maturity_date,
            })
            acct_num += 1

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'share_accounts')
    mark_done('share_accounts')
    print(f"  inserted {len(df)} rows into share_accounts")


def run():
    conn = get_conn()
    generate_members(conn)
    generate_loan_applications(conn)
    generate_loan_accounts(conn)
    generate_share_accounts(conn)
    conn.close()
    print("Wave 3 members complete.")


if __name__ == '__main__':
    run()
