"""wave4c: financial tables — share_transactions, income_statement_monthly, gl_reconciliation,
alll_reserves, borrowing_lines, liquidity_projections, capital_liquidity_snapshot,
investments, interest_rate_swaps, fee_income_detail, dividend_declarations"""
import uuid
import random
import pandas as pd
import numpy as np
from utils import get_conn, copy_df_to_table, fetch_rows, is_done, mark_done
from config import SCENARIO_PERIODS

random.seed(300)
np.random.seed(300)

def _build_scenario_map():
    dr = pd.date_range('2020-01-01', '2026-10-31')
    m = {str(d.date()): None for d in dr}
    for s, e, sp in SCENARIO_PERIODS:
        for d in pd.date_range(s, e):
            k = str(d.date())
            if k in m and m[k] is None:
                m[k] = sp
    return m

SMAP = _build_scenario_map()
SHUTDOWN_MONTHS = {str(d.date())[:7] for d, sp in SMAP.items() if sp == 'GOVERNMENT_SHUTDOWN'}
COVID_MONTHS = {str(d.date())[:7] for d, sp in SMAP.items() if sp == 'COVID_EMERGENCY'}
ZERO_RATE_MONTHS = {str(d.date())[:7] for d, sp in SMAP.items() if sp == 'ZERO_RATE_ENV'}
HIKE_MONTHS = {str(d.date())[:7] for d, sp in SMAP.items() if sp == 'RATE_HIKE_CYCLE'}


def generate_share_transactions(conn):
    if is_done('share_transactions'):
        print("share_transactions already done, skipping.")
        return
    print("Generating share_transactions (chunked, ~3.4M rows expected)...")

    accounts = fetch_rows(conn,
        "SELECT account_id, opened_date, closed_date, account_status, current_balance FROM share_accounts WHERE account_status != 'CLOSED'")
    end_date = pd.Timestamp('2026-10-31')

    txn_types = ['DEPOSIT','WITHDRAWAL','TRANSFER','DIVIDEND','FEE']
    base_weights = [0.40, 0.35, 0.15, 0.05, 0.05]
    batch_size = 500
    total_inserted = 0

    for chunk_start in range(0, len(accounts), batch_size):
        chunk = accounts[chunk_start:chunk_start + batch_size]
        rows = []

        for acct in chunk:
            acct_id = acct['account_id']
            open_dt = pd.Timestamp(str(acct['opened_date']))
            if acct['closed_date']:
                close_dt = min(pd.Timestamp(str(acct['closed_date'])), end_date)
            else:
                close_dt = end_date

            curr_bal = float(acct['current_balance'] or 1000)
            balance = max(curr_bal * random.uniform(0.5, 1.5), 50)

            for month in pd.date_range(open_dt, close_dt, freq='MS'):
                mk = month.strftime('%Y-%m')
                date_str = month.date().strftime('%Y-%m-%d')
                sp = SMAP.get(date_str)
                is_shutdown = sp == 'GOVERNMENT_SHUTDOWN'
                is_covid = sp == 'COVID_EMERGENCY'
                is_stimulus = sp == 'STIMULUS_ACTIVE'

                n_txns = random.randint(8, 15)
                if is_covid:
                    n_txns = random.randint(5, 12)

                for _ in range(n_txns):
                    txn_day = random.randint(1, 28)
                    txn_dt = month.replace(day=txn_day)
                    if txn_dt > close_dt:
                        break
                    txn_type = np.random.choice(txn_types, p=base_weights)

                    if txn_type == 'DEPOSIT':
                        amt = random.uniform(200, 3000)
                        if is_stimulus and random.random() < 0.3:
                            amt = random.choice([600, 1200, 1400])
                        if is_covid:
                            amt *= 1.18
                    elif txn_type == 'WITHDRAWAL':
                        amt = random.uniform(50, 1500)
                        if is_shutdown:
                            amt *= 1.4
                    elif txn_type == 'TRANSFER':
                        amt = random.uniform(100, 2000)
                    elif txn_type == 'DIVIDEND':
                        amt = round(balance * random.uniform(0.0001, 0.001), 2)
                    else:
                        amt = random.choice([3, 5, 10, 25, 35])

                    amt = round(amt, 2)
                    if txn_type in ('DEPOSIT','DIVIDEND'):
                        balance = round(balance + amt, 2)
                    else:
                        balance = round(max(0, balance - amt), 2)

                    # Channel
                    if is_covid:
                        channel = np.random.choice(['BRANCH','ATM','ACH','MOBILE','ONLINE'], p=[0.02,0.15,0.28,0.45,0.10])
                    else:
                        channel = np.random.choice(['BRANCH','ATM','ACH','MOBILE','ONLINE'], p=[0.15,0.20,0.35,0.20,0.10])

                    rows.append({
                        'transaction_id': str(uuid.uuid4()),
                        'account_id': acct_id,
                        'transaction_date': txn_dt.date().strftime('%Y-%m-%d'),
                        'transaction_type': txn_type,
                        'amount': amt,
                        'running_balance': balance,
                        'channel': channel,
                        'reference': None,
                        'government_shutdown_related': is_shutdown,
                    })

        if rows:
            df = pd.DataFrame(rows)
            copy_df_to_table(conn, df, 'share_transactions')
            total_inserted += len(rows)
            if chunk_start % 5000 == 0:
                print(f"  ...{total_inserted} share_transactions so far")

    mark_done('share_transactions')
    print(f"  share_transactions done: {total_inserted} total rows")


def generate_income_statement_monthly(conn):
    if is_done('income_statement_monthly'):
        print("income_statement_monthly already done, skipping.")
        return
    print("Generating income_statement_monthly...")

    months = pd.date_range('2020-01-01', '2026-10-01', freq='MS')
    rows = []
    for month in months:
        mk = month.strftime('%Y-%m')
        date_str = month.date().strftime('%Y-%m-%d')
        sp = SMAP.get(date_str)
        yr_frac = (month.year - 2020) + (month.month - 1) / 12

        # Base income grows over time
        base_loan_income = 3200000 + yr_frac * 200000
        base_inv_income = 250000 + yr_frac * 10000

        nim_mod = 1.0
        deposit_cost_mod = 1.0
        if mk in ZERO_RATE_MONTHS:
            nim_mod = 0.78
            deposit_cost_mod = 0.3
        elif mk in HIKE_MONTHS:
            nim_mod = 1.22
            deposit_cost_mod = 1.8

        loan_income = round(base_loan_income * nim_mod * random.uniform(0.98, 1.02), 2)
        inv_income = round(base_inv_income * random.uniform(0.95, 1.05), 2)
        total_interest_income = round(loan_income + inv_income, 2)

        base_dep_expense = 180000
        dep_expense = round(base_dep_expense * deposit_cost_mod * random.uniform(0.95, 1.05), 2)
        borrow_expense = round(50000 * deposit_cost_mod * random.uniform(0.8, 1.2), 2)
        total_interest_expense = round(dep_expense + borrow_expense, 2)
        nii = round(total_interest_income - total_interest_expense, 2)

        nim = round(nii / (650000000 + yr_frac * 20000000) * 12, 4)

        provision = 120000
        if mk in COVID_MONTHS:
            provision = 800000 if month.month in (4, 5, 6, 7) and month.year == 2020 else 300000
        provision = round(provision * random.uniform(0.9, 1.1), 2)

        nii_after = round(nii - provision, 2)

        base_fee = 220000
        if mk in COVID_MONTHS:
            base_fee = 150000  # fee waivers
        fee_income = round(base_fee * random.uniform(0.92, 1.08), 2)
        svc_charge = round(fee_income * 0.3, 2)
        other_nii = round(fee_income * 0.1, 2)
        total_nii_income = round(fee_income + other_nii, 2)

        comp_exp = round((1100000 + yr_frac * 25000) * random.uniform(0.98, 1.02), 2)
        occ_exp = round(85000 * random.uniform(0.95, 1.05), 2)
        tech_exp = round(120000 * random.uniform(0.95, 1.1), 2)
        other_exp = round(90000 * random.uniform(0.9, 1.1), 2)
        total_nonint_exp = round(comp_exp + occ_exp + tech_exp + other_exp, 2)

        net_income = round(nii_after + total_nii_income - total_nonint_exp, 2)
        efficiency = round(total_nonint_exp / (nii + total_nii_income + 0.01), 4)
        roa = round(net_income / (650000000 + yr_frac * 20000000) * 12, 4)
        roe = round(roa * 10, 4)

        budget_ni = round(net_income * random.uniform(0.92, 1.08), 2)

        rows.append({
            'statement_id': str(uuid.uuid4()),
            'statement_month': date_str,
            'interest_income_loans': loan_income,
            'interest_income_investments': inv_income,
            'total_interest_income': total_interest_income,
            'interest_expense_deposits': dep_expense,
            'interest_expense_borrowings': borrow_expense,
            'total_interest_expense': total_interest_expense,
            'net_interest_income': nii,
            'provision_for_loan_losses': provision,
            'net_interest_income_after_provision': nii_after,
            'fee_income': fee_income,
            'service_charge_income': svc_charge,
            'other_non_interest_income': other_nii,
            'total_non_interest_income': total_nii_income,
            'compensation_expense': comp_exp,
            'occupancy_expense': occ_exp,
            'technology_expense': tech_exp,
            'other_operating_expense': other_exp,
            'total_non_interest_expense': total_nonint_exp,
            'net_income': net_income,
            'efficiency_ratio': efficiency,
            'nim': nim,
            'roa': roa,
            'roe': roe,
            'budget_net_income': budget_ni,
            'variance_vs_budget': round(net_income - budget_ni, 2),
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'income_statement_monthly')
    mark_done('income_statement_monthly')
    print(f"  inserted {len(df)} rows into income_statement_monthly")


def generate_gl_reconciliation(conn):
    if is_done('gl_reconciliation'):
        print("gl_reconciliation already done, skipping.")
        return
    print("Generating gl_reconciliation...")
    gl_accounts = fetch_rows(conn, "SELECT gl_account_id FROM general_ledger_account WHERE is_summary=FALSE")
    staff_ids = [r['staff_id'] for r in fetch_rows(conn, "SELECT staff_id FROM staff WHERE department='Finance' LIMIT 6")]
    months = pd.date_range('2020-01-01', '2026-10-01', freq='MS')

    # Pick 20 key accounts for monthly reconciliation
    key_accounts = gl_accounts[:20] if len(gl_accounts) >= 20 else gl_accounts

    rows = []
    for month in months:
        date_str = month.date().strftime('%Y-%m-%d')
        for acct in key_accounts:
            gl_bal = round(random.uniform(100000, 50000000), 2)
            material = random.random() < 0.03
            if material:
                var_pct = round(random.uniform(0.001, 0.02), 4)
            else:
                var_pct = round(random.uniform(0, 0.001), 4)
            sub_bal = round(gl_bal * (1 + var_pct * random.choice([-1, 1])), 2)
            variance = round(gl_bal - sub_bal, 2)
            reconciled = not material or random.random() < 0.5

            rows.append({
                'recon_id': str(uuid.uuid4()),
                'recon_date': date_str,
                'gl_account_id': acct['gl_account_id'],
                'gl_balance': gl_bal,
                'sub_ledger_balance': sub_bal,
                'variance': variance,
                'variance_pct': var_pct,
                'reconciled': reconciled,
                'reconciled_by': random.choice(staff_ids) if staff_ids else None,
                'reconciliation_notes': 'Normal reconciliation' if not material else 'Material variance under investigation',
                'exceptions_count': random.randint(1, 5) if not reconciled else 0,
                'material_variance': material,
                'reviewed_date': (month + pd.Timedelta(days=random.randint(3, 10))).date().strftime('%Y-%m-%d'),
            })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'gl_reconciliation')
    mark_done('gl_reconciliation')
    print(f"  inserted {len(df)} rows into gl_reconciliation")


def generate_alll_reserves(conn):
    if is_done('alll_reserves'):
        print("alll_reserves already done, skipping.")
        return
    print("Generating alll_reserves...")
    products = fetch_rows(conn, "SELECT product_id, product_category FROM loan_products")
    months = pd.date_range('2020-01-01', '2026-10-01', freq='MS')
    segments = ['MORTGAGE','AUTO','PERSONAL','HELOC','CREDIT_CARD','BUSINESS','OTHER']
    reserve_rates = {'MORTGAGE':0.005,'AUTO':0.015,'PERSONAL':0.020,'HELOC':0.010,'CREDIT_CARD':0.025,'BUSINESS':0.015,'OTHER':0.012}
    prod_by_seg = {}
    for p in products:
        seg = p['product_category']
        if seg not in prod_by_seg:
            prod_by_seg[seg] = p['product_id']

    rows = []
    running_bal = {seg: round(random.uniform(500000, 2000000), 2) for seg in segments}

    for month in months:
        date_str = month.date().strftime('%Y-%m-%d')
        mk = month.strftime('%Y-%m')
        is_covid = mk in COVID_MONTHS
        is_cecl = month.year >= 2023

        for seg in segments:
            rate = reserve_rates[seg]
            loan_bal = round(random.uniform(5000000, 80000000), 2)
            begin_bal = running_bal[seg]
            charge_offs = round(loan_bal * rate * random.uniform(0.3, 0.7) / 12, 2)
            recoveries = round(charge_offs * random.uniform(0.15, 0.35), 2)
            provision = round(loan_bal * rate / 12 * random.uniform(0.8, 1.2), 2)
            if is_covid and month.year == 2020 and month.month in range(4, 9):
                provision *= 3.5

            end_bal = round(begin_bal + provision - charge_offs + recoveries, 2)
            running_bal[seg] = end_bal

            rows.append({
                'reserve_id': str(uuid.uuid4()),
                'reserve_date': date_str,
                'product_id': prod_by_seg.get(seg),
                'loan_segment': seg,
                'beginning_balance': begin_bal,
                'provision_expense': provision,
                'charge_offs': charge_offs,
                'recoveries': recoveries,
                'ending_balance': end_bal,
                'loan_balance': loan_bal,
                'reserve_rate': rate,
                'qualitative_adjustment': round(provision * random.uniform(0.0, 0.1), 2),
                'model_loss_estimate': round(loan_bal * rate / 12, 2),
                'management_overlay': round(provision * random.uniform(0.0, 0.05), 2),
                'cecl_compliant': is_cecl,
            })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'alll_reserves')
    mark_done('alll_reserves')
    print(f"  inserted {len(df)} rows into alll_reserves")


def generate_borrowing_lines(conn):
    if is_done('borrowing_lines'):
        print("borrowing_lines already done, skipping.")
        return
    print("Generating borrowing_lines...")

    lines = [
        ('Federal Home Loan Bank', 'FHLB', 50000000, 12000000, 0.0325, 65000000, 'Mortgage loans', '2028-06-30'),
        ('Federal Reserve Bank', 'FED_DISCOUNT_WINDOW', 10000000, 0, 0.0525, None, None, None),
        ('Corporate CU Liquidity Facility', 'CLF', 20000000, 3000000, 0.0285, 25000000, 'Investment securities', '2027-12-31'),
        ('US Central Corporate CU', 'CORPORATE_CU', 5000000, 1000000, 0.0310, 6000000, 'Agency securities', '2027-06-30'),
    ]

    rows = []
    for l in lines:
        credit_lim = l[2]
        curr_bal = l[3]
        avail_bal = credit_lim - curr_bal
        rows.append({
            'line_id': str(uuid.uuid4()),
            'lender_name': l[0],
            'line_type': l[1],
            'credit_limit': credit_lim,
            'current_balance': curr_bal,
            'available_balance': avail_bal,
            'utilization_pct': round(curr_bal / credit_lim, 4) if credit_lim > 0 else 0,
            'rate': l[4],
            'collateral_pledged': l[5],
            'collateral_type': l[6],
            'maturity_date': l[7],
            'status': 'ACTIVE',
            'last_draw_date': '2026-09-15' if curr_bal > 0 else None,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'borrowing_lines')
    mark_done('borrowing_lines')
    print(f"  inserted {len(df)} rows into borrowing_lines")


def generate_liquidity_projections(conn):
    if is_done('liquidity_projections'):
        print("liquidity_projections already done, skipping.")
        return
    print("Generating liquidity_projections...")
    quarters = pd.date_range('2020-01-01', '2026-10-01', freq='QS')
    scenarios = ['BASE','STRESS','GOVERNMENT_SHUTDOWN','RATE_SHOCK']

    rows = []
    for qtr in quarters:
        date_str = qtr.date().strftime('%Y-%m-%d')
        mk = qtr.strftime('%Y-%m')
        is_covid = mk in COVID_MONTHS

        for scenario in scenarios:
            inflows = round(random.uniform(45000000, 70000000), 2)
            stress_mult = {'BASE':1.0,'STRESS':0.75,'GOVERNMENT_SHUTDOWN':0.80,'RATE_SHOCK':0.85}[scenario]
            outflows = round(inflows * stress_mult * random.uniform(0.85, 0.95), 2)
            if is_covid and scenario == 'STRESS':
                outflows = round(outflows * 1.3, 2)
            net = round(inflows - outflows, 2)
            borrow_cap = round(random.uniform(25000000, 50000000), 2)
            min_req = round(inflows * 0.10, 2)
            buffer = round(net + borrow_cap - min_req, 2)
            sufficient = buffer > 0

            rows.append({
                'projection_id': str(uuid.uuid4()),
                'projection_date': date_str,
                'scenario': scenario,
                'projection_horizon_days': 90,
                'projected_cash_inflows': inflows,
                'projected_cash_outflows': outflows,
                'net_cash_position': net,
                'borrowing_capacity_available': borrow_cap,
                'minimum_liquidity_requirement': min_req,
                'liquidity_buffer': buffer,
                'liquidity_sufficient': sufficient,
            })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'liquidity_projections')
    mark_done('liquidity_projections')
    print(f"  inserted {len(df)} rows into liquidity_projections")


def generate_capital_liquidity_snapshot(conn):
    if is_done('capital_liquidity_snapshot'):
        print("capital_liquidity_snapshot already done, skipping.")
        return
    print("Generating capital_liquidity_snapshot...")
    months = pd.date_range('2020-01-01', '2026-10-01', freq='MS')

    rows = []
    for month in months:
        date_str = month.date().strftime('%Y-%m-%d')
        mk = month.strftime('%Y-%m')
        yr_frac = (month.year - 2020) + (month.month - 1) / 12

        total_assets = round(650000000 + yr_frac * 25000000 + random.uniform(-2000000, 2000000), 2)
        is_covid_peak = mk in COVID_MONTHS and month.year == 2020 and month.month in [5, 6, 7]
        nwr = round(random.uniform(10.5 if not is_covid_peak else 10.2, 11.5), 4)
        total_equity = round(total_assets * nwr / 100, 2)
        total_loans = round(total_assets * random.uniform(0.60, 0.70), 2)
        total_deposits = round(total_assets * random.uniform(0.78, 0.84), 2)
        lts_ratio = round(total_loans / total_deposits, 4)
        liq_ratio = round(random.uniform(0.12, 0.18), 4)

        rows.append({
            'snapshot_id': str(uuid.uuid4()),
            'snapshot_date': date_str,
            'total_assets': total_assets,
            'total_loans': total_loans,
            'total_deposits': total_deposits,
            'total_equity': total_equity,
            'net_worth_ratio': nwr / 100,
            'risk_weighted_assets': round(total_assets * 0.72, 2),
            'tier1_capital_ratio': round(nwr / 100 * 1.1, 4),
            'total_capital_ratio': round(nwr / 100 * 1.15, 4),
            'leverage_ratio': round(total_equity / total_assets, 4),
            'well_capitalized_threshold': 0.07,
            'adequately_capitalized_threshold': 0.06,
            'ncua_net_worth_category': 'WELL_CAPITALIZED',
            'liquidity_ratio': liq_ratio,
            'loan_to_share_ratio': lts_ratio,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'capital_liquidity_snapshot')
    mark_done('capital_liquidity_snapshot')
    print(f"  inserted {len(df)} rows into capital_liquidity_snapshot")


def generate_investments(conn):
    if is_done('investments'):
        print("investments already done, skipping.")
        return
    print("Generating investments...")

    sec_types = ['TREASURY','AGENCY','MBS','MUNICIPAL']
    type_weights = [0.40, 0.30, 0.20, 0.10]
    classifications = ['AVAILABLE_FOR_SALE','HELD_TO_MATURITY']
    class_weights = [0.40, 0.60]

    securities = [
        ('US Treasury Note 2.5% 2027', 'TREASURY', '2027-06-30', 0.025, 3.5),
        ('US Treasury Note 3.0% 2029', 'TREASURY', '2029-09-30', 0.030, 5.2),
        ('US Treasury Bond 2.75% 2032', 'TREASURY', '2032-02-28', 0.0275, 7.8),
        ('FNMA Pool 2.0% 2033', 'AGENCY', '2033-05-01', 0.020, 6.5),
        ('FHLMC Pool 2.5% 2031', 'AGENCY', '2031-08-01', 0.025, 5.8),
        ('Ginnie Mae Pool 2.25% 2034', 'MBS', '2034-03-01', 0.0225, 7.2),
        ('DC Municipal Revenue 3.5% 2028', 'MUNICIPAL', '2028-10-01', 0.035, 4.1),
        ('VA Municipal GO 3.0% 2026', 'MUNICIPAL', '2026-07-01', 0.030, 2.5),
        ('FNMA Discount Note 2024', 'AGENCY', '2024-12-31', 0.045, 1.0),
        ('US Treasury Bill 2024', 'TREASURY', '2024-09-30', 0.052, 0.8),
    ]

    rows = []
    for i in range(35):
        if i < len(securities):
            s = securities[i]
            name, sec_type, mat_date, coupon, duration = s
        else:
            sec_type = np.random.choice(sec_types, p=type_weights)
            name = f'{sec_type} Security {i+1}'
            yr = random.randint(2024, 2035)
            mat_date = f'{yr}-{random.randint(1,12):02d}-01'
            coupon = round(random.uniform(0.015, 0.055), 4)
            duration = round(random.uniform(1.0, 10.0), 2)

        classification = np.random.choice(classifications, p=class_weights)
        par = round(random.uniform(1000000, 10000000), 2)
        # Fair value based on rate environment (unrealized loss during hike cycle for AFS)
        is_afs = classification == 'AVAILABLE_FOR_SALE'
        unrealized = round(par * random.uniform(-0.08, 0.02) if is_afs else 0, 2)
        fair_val = round(par + unrealized, 2)
        book_val = par  # HTM at par, AFS at fair value
        if is_afs:
            book_val = fair_val
        status = 'ACTIVE'
        if mat_date < '2026-01-01':
            status = random.choice(['MATURED','ACTIVE'])

        rows.append({
            'investment_id': str(uuid.uuid4()),
            'cusip': f'{random.randint(100000000,999999999):09d}',
            'security_name': name,
            'security_type': sec_type,
            'portfolio_classification': 'AVAILABLE_FOR_SALE' if classification == 'AVAILABLE_FOR_SALE' else 'HELD_TO_MATURITY',
            'par_value': par,
            'book_value': book_val,
            'fair_value': fair_val,
            'unrealized_gain_loss': unrealized,
            'coupon_rate': coupon,
            'yield_to_maturity': round(coupon + random.uniform(-0.005, 0.015), 4),
            'maturity_date': mat_date,
            'duration_years': duration,
            'weighted_avg_life': round(duration * 0.85, 2),
            'purchase_date': fake_purchase_date(mat_date),
            'status': status,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'investments')
    mark_done('investments')
    print(f"  inserted {len(df)} rows into investments")


def fake_purchase_date(mat_date):
    try:
        mat = pd.Timestamp(mat_date)
        purchase = mat - pd.DateOffset(years=random.randint(2, 7))
        return purchase.date().strftime('%Y-%m-%d')
    except Exception:
        return '2020-01-01'


def generate_interest_rate_swaps(conn):
    if is_done('interest_rate_swaps'):
        print("interest_rate_swaps already done, skipping.")
        return
    print("Generating interest_rate_swaps...")

    swaps = [
        ('Goldman Sachs', '2020-03-15', '2020-06-01', '2025-06-01', 15000000, 0.0215, 'SOFR', 0.0, 'ACTIVE'),
        ('JPMorgan Chase', '2021-01-10', '2021-03-01', '2026-03-01', 20000000, 0.0180, 'SOFR', 0.0, 'ACTIVE'),
        ('Citibank', '2019-06-20', '2019-09-01', '2024-09-01', 10000000, 0.0255, 'SOFR', 0.0, 'MATURED'),
        ('Wells Fargo', '2022-04-05', '2022-06-01', '2027-06-01', 8000000, 0.0320, 'SOFR', 0.0, 'ACTIVE'),
        ('Bank of America', '2020-11-15', '2021-01-01', '2024-01-01', 5000000, 0.0195, 'SOFR', 0.0, 'MATURED'),
    ]
    # Adjust status: 3 active, 1 matured, 1 terminated (last becomes terminated)
    swaps[4] = (swaps[4][0],swaps[4][1],swaps[4][2],swaps[4][3],swaps[4][4],swaps[4][5],swaps[4][6],swaps[4][7],'TERMINATED')

    rows = []
    for s in swaps:
        notional = s[4]
        is_active = s[8] == 'ACTIVE'
        # Fair value: negative in zero rate env (fixed > market), positive in hike cycle
        fair_val = round(notional * random.uniform(-0.03, 0.025), 2)
        rows.append({
            'swap_id': str(uuid.uuid4()),
            'counterparty': s[0],
            'trade_date': s[1],
            'effective_date': s[2],
            'maturity_date': s[3],
            'notional_amount': notional,
            'leg_type': 'PAY_FIXED',
            'fixed_rate': s[5],
            'floating_index': s[6],
            'floating_spread': s[7],
            'fair_value': fair_val,
            'unrealized_gain_loss': fair_val,
            'hedge_designation': 'CASH_FLOW',
            'hedged_item_description': 'FHLB floating advance hedge',
            'status': s[8],
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'interest_rate_swaps')
    mark_done('interest_rate_swaps')
    print(f"  inserted {len(df)} rows into interest_rate_swaps")


def generate_fee_income_detail(conn):
    if is_done('fee_income_detail'):
        print("fee_income_detail already done, skipping.")
        return
    print("Generating fee_income_detail (~80k rows)...")
    members = fetch_rows(conn, "SELECT member_id FROM members WHERE status='ACTIVE' LIMIT 5000")
    loan_accounts = fetch_rows(conn, "SELECT loan_id, member_id, product_id FROM loan_accounts LIMIT 2000")
    share_accounts = fetch_rows(conn, "SELECT account_id, member_id, product_id FROM share_accounts WHERE account_status='ACTIVE' LIMIT 3000")
    branches = fetch_rows(conn, "SELECT branch_id FROM branches")
    gl_accounts = fetch_rows(conn, "SELECT gl_account_id FROM general_ledger_account WHERE account_type='INCOME' AND sub_type='FEE'")

    fee_types = ['NSF','SERVICE_CHARGE','LATE','ATM','ORIGINATION','WIRE','OTHER','OVERDRAFT','ANNUAL','PREPAYMENT']
    fee_weights = [0.30, 0.25, 0.20, 0.10, 0.05, 0.04, 0.03, 0.02, 0.01, 0.01]
    # Normalize
    fee_weights = np.array(fee_weights) / sum(fee_weights)

    fee_amounts = {
        'NSF': 35.0, 'SERVICE_CHARGE': 10.0, 'LATE': 35.0, 'ATM': 3.0,
        'ORIGINATION': 0.0, 'WIRE': 25.0, 'OTHER': 15.0, 'OVERDRAFT': 35.0,
        'ANNUAL': 50.0, 'PREPAYMENT': 0.0
    }

    months = pd.date_range('2020-01-01', '2026-10-01', freq='MS')
    rows = []
    target = 80000
    per_month = target // len(months)

    for month in months:
        date_str = month.date().strftime('%Y-%m-%d')
        mk = month.strftime('%Y-%m')
        is_covid = mk in COVID_MONTHS

        for _ in range(per_month):
            member = random.choice(members)
            fee_type = np.random.choice(fee_types[:8], p=fee_weights[:8] / fee_weights[:8].sum())

            # Map to valid CHECK values
            type_map = {'NSF':'NSF','SERVICE_CHARGE':'SERVICE_CHARGE','LATE':'LATE','ATM':'ATM',
                       'ORIGINATION':'ORIGINATION','WIRE':'WIRE','OTHER':'OTHER','OVERDRAFT':'OVERDRAFT',
                       'ANNUAL':'ANNUAL','PREPAYMENT':'PREPAYMENT'}
            db_fee_type = type_map.get(fee_type, 'OTHER')

            base_amt = fee_amounts.get(fee_type, 15.0)
            if fee_type == 'ORIGINATION':
                base_amt = round(random.uniform(500, 3000), 2)
            elif fee_type == 'PREPAYMENT':
                base_amt = round(random.uniform(100, 1000), 2)
            else:
                base_amt = round(base_amt + random.uniform(-5, 5), 2)
            base_amt = max(1.0, base_amt)

            waived = random.random() < 0.15
            if is_covid and fee_type in ('NSF','OVERDRAFT','SERVICE_CHARGE'):
                waived = random.random() < 0.4

            # Choose loan or share account based on fee type
            loan_acct_id = None
            share_acct_id = None
            if fee_type in ('ORIGINATION','PREPAYMENT','LATE') and loan_accounts:
                la = random.choice(loan_accounts)
                if la['member_id'] == member['member_id'] or random.random() < 0.5:
                    loan_acct_id = la['loan_id']
            elif fee_type in ('NSF','OVERDRAFT','SERVICE_CHARGE','ATM') and share_accounts:
                sa = random.choice(share_accounts)
                if sa['member_id'] == member['member_id'] or random.random() < 0.5:
                    share_acct_id = sa['account_id']

            rows.append({
                'fee_id': str(uuid.uuid4()),
                'fee_date': date_str,
                'product_id': None,
                'share_product_id': None,
                'fee_type': db_fee_type,
                'fee_amount': base_amt,
                'member_id': member['member_id'],
                'loan_account_id': loan_acct_id,
                'share_account_id': share_acct_id,
                'branch_id': random.choice(branches)['branch_id'] if branches else None,
                'waived': waived,
                'waived_reason': 'COVID fee waiver program' if waived and is_covid else ('Customer courtesy' if waived else None),
                'gl_account_id': random.choice(gl_accounts)['gl_account_id'] if gl_accounts else None,
            })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'fee_income_detail')
    mark_done('fee_income_detail')
    print(f"  inserted {len(df)} rows into fee_income_detail")


def generate_dividend_declarations(conn):
    if is_done('dividend_declarations'):
        print("dividend_declarations already done, skipping.")
        return
    print("Generating dividend_declarations...")
    products = fetch_rows(conn, "SELECT product_id, product_code, product_category FROM share_products")
    rate_env = fetch_rows(conn, "SELECT rate_date, fed_funds_rate FROM rate_environment ORDER BY rate_date")
    rate_by_month = {str(r['rate_date'])[:7]: float(r['fed_funds_rate'] or 0.1) for r in rate_env}

    # Base dividend rates per product (scales with fed funds)
    base_div = {
        'FREE_CHECKING': 0.0001, 'PREMIUM_CHECKING': 0.0005, 'REGULAR_SAVINGS': 0.0005,
        'MONEY_MARKET': 0.0015, 'CERT_12MO': 0.005, 'CERT_24MO': 0.0075, 'CERT_36MO': 0.010,
        'IRA_SAVINGS': 0.001, 'HOLIDAY_CLUB': 0.0005
    }

    rows = []
    months = pd.date_range('2020-01-01', '2026-10-01', freq='MS')
    for month in months:
        mk = month.strftime('%Y-%m')
        date_str = month.date().strftime('%Y-%m-%d')
        fed = rate_by_month.get(mk, 1.75)
        fed_ratio = fed / 1.75  # scale relative to baseline

        for prod in products:
            code = prod['product_code']
            base = base_div.get(code, 0.0005)
            # Scale with rate environment
            if mk in ZERO_RATE_MONTHS:
                rate = round(base * 0.3, 6)
            elif mk in HIKE_MONTHS:
                rate = round(base * fed_ratio, 6)
            else:
                rate = round(base * fed_ratio * random.uniform(0.95, 1.05), 6)

            rate = max(0.00001, rate)
            # Certificates: quarterly declarations; others: monthly
            cat = prod['product_category']
            period_type = 'QUARTERLY' if cat == 'CERTIFICATE' else 'MONTHLY'
            if period_type == 'QUARTERLY' and month.month not in (1, 4, 7, 10):
                continue

            pay_dt = (month + pd.Timedelta(days=15)).date().strftime('%Y-%m-%d')
            rows.append({
                'declaration_id': str(uuid.uuid4()),
                'product_id': prod['product_id'],
                'declaration_date': date_str,
                'record_date': date_str,
                'payment_date': pay_dt,
                'declared_rate': rate,
                'declared_apy': round(rate * 12, 6) if period_type == 'MONTHLY' else round(rate * 4, 6),
                'period_type': period_type,
                'total_dividends_paid': round(random.uniform(10000, 500000), 2),
                'members_eligible': random.randint(500, 5000),
                'declared_by_board_resolution': f'BR-{month.year}-{month.month:02d}-{random.randint(1,10):02d}',
                'fiscal_quarter': (month.month - 1) // 3 + 1,
                'fiscal_year': month.year,
            })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'dividend_declarations')
    mark_done('dividend_declarations')
    print(f"  inserted {len(df)} rows into dividend_declarations")


def run():
    conn = get_conn()
    generate_share_transactions(conn)
    generate_income_statement_monthly(conn)
    generate_gl_reconciliation(conn)
    generate_alll_reserves(conn)
    generate_borrowing_lines(conn)
    generate_liquidity_projections(conn)
    generate_capital_liquidity_snapshot(conn)
    generate_investments(conn)
    generate_interest_rate_swaps(conn)
    generate_fee_income_detail(conn)
    generate_dividend_declarations(conn)
    conn.close()
    print("Wave 4c finance complete.")


if __name__ == '__main__':
    # Import needed in module scope but referenced in generate_investments
    from faker import Faker
    global fake
    fake = Faker()
    run()
