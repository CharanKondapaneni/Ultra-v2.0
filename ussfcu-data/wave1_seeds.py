import uuid
import json
import pandas as pd
import numpy as np
from datetime import date, timedelta
from utils import get_conn, copy_df_to_table, is_done, mark_done
from config import SCENARIO_PERIODS, BRANCHES


def generate_fiscal_calendar(conn):
    if is_done('fiscal_calendar'):
        print("fiscal_calendar already done, skipping.")
        return
    print("Generating fiscal_calendar...")

    start = date(2020, 1, 1)
    end = date(2026, 10, 31)
    dates = pd.date_range(start, end)

    # Build scenario priority map
    PRIORITY = [
        'GOVERNMENT_SHUTDOWN', 'COVID_EMERGENCY', 'STIMULUS_ACTIVE',
        'RATE_HIKE_CYCLE', 'ZERO_RATE_ENV', 'MILITARY_SURGE',
        'DEBT_CEILING_CRISIS', 'BANKING_SECTOR_STRESS',
        'POST_PANDEMIC_NORMALIZATION', 'CONGRESSIONAL_TRANSITION',
        'CONTINUING_RESOLUTION'
    ]
    priority_rank = {sp: i for i, sp in enumerate(PRIORITY)}

    scenario_map = {}
    for s, e, sp in SCENARIO_PERIODS:
        for d in pd.date_range(s, e):
            key = d.date()
            if key in scenario_map:
                if priority_rank.get(sp, 99) < priority_rank.get(scenario_map[key], 99):
                    scenario_map[key] = sp
            else:
                scenario_map[key] = sp

    # Shutdown periods for numbering
    shutdown_starts = [(pd.Timestamp(s).date(), pd.Timestamp(e).date())
                       for s, e, sp in SCENARIO_PERIODS if sp == 'GOVERNMENT_SHUTDOWN']

    def shutdown_day_num(d):
        for s, e in shutdown_starts:
            if s <= d <= e:
                return (d - s).days + 1
        return None

    # Federal holidays (simplified)
    def is_holiday(d):
        m, day, wd = d.month, d.day, d.weekday()
        # New Year's Day
        if m == 1 and day == 1: return True
        # MLK Day - 3rd Monday January
        if m == 1 and wd == 0 and 15 <= day <= 21: return True
        # Presidents Day - 3rd Monday February
        if m == 2 and wd == 0 and 15 <= day <= 21: return True
        # Memorial Day - last Monday May
        if m == 5 and wd == 0 and day >= 25: return True
        # Juneteenth
        if m == 6 and day == 19: return True
        # Independence Day
        if m == 7 and day == 4: return True
        # Labor Day - 1st Monday September
        if m == 9 and wd == 0 and day <= 7: return True
        # Columbus Day - 2nd Monday October
        if m == 10 and wd == 0 and 8 <= day <= 14: return True
        # Veterans Day
        if m == 11 and day == 11: return True
        # Thanksgiving - 4th Thursday November
        if m == 11 and wd == 3 and 22 <= day <= 28: return True
        # Christmas
        if m == 12 and day == 25: return True
        return False

    # Pay period ends: every other Friday starting 2020-01-10
    pay_period_fridays = set()
    pp = date(2020, 1, 10)
    while pp <= end:
        pay_period_fridays.add(pp)
        pp += timedelta(days=14)

    rows = []
    for ts in dates:
        d = ts.date()
        sp = scenario_map.get(d)
        is_shutdown = sp == 'GOVERNMENT_SHUTDOWN'
        sdn = shutdown_day_num(d) if is_shutdown else None
        rows.append({
            'fiscal_date': str(d),
            'fiscal_year': d.year,
            'fiscal_quarter': (d.month - 1) // 3 + 1,
            'fiscal_month': d.month,
            'fiscal_week': ts.isocalendar()[1],
            'federal_holiday': is_holiday(d),
            'government_shutdown': is_shutdown,
            'shutdown_day_number': sdn,
            'pay_period_end': d in pay_period_fridays,
            'congressional_session': d.month != 8,
            'special_period': sp,
            'notes': None,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'fiscal_calendar')
    mark_done('fiscal_calendar')
    print(f"  inserted {len(df)} rows into fiscal_calendar")


def generate_loan_products(conn):
    if is_done('loan_products'):
        print("loan_products already done, skipping.")
        return
    print("Generating loan_products...")

    products = [
        ('MORTGAGE_30YR_FIXED', '30-Year Fixed Mortgage', 'MORTGAGE', False, True, True, 'SOFR', 2.75, 360, 360, 50000, 1500000),
        ('MORTGAGE_15YR_FIXED', '15-Year Fixed Mortgage', 'MORTGAGE', False, True, True, 'SOFR', 2.25, 180, 180, 50000, 1500000),
        ('MORTGAGE_ARM_5_1', '5/1 ARM Mortgage', 'MORTGAGE', False, True, True, 'SOFR', 2.0, 360, 360, 50000, 1500000),
        ('AUTO_NEW', 'New Auto Loan', 'AUTO', True, False, False, 'PRIME', 1.5, 12, 84, 5000, 75000),
        ('AUTO_USED', 'Used Auto Loan', 'AUTO', True, False, False, 'PRIME', 2.5, 12, 72, 3000, 50000),
        ('PERSONAL_LOAN', 'Personal Loan', 'PERSONAL', True, False, False, 'PRIME', 4.0, 12, 60, 500, 50000),
        ('HELOC', 'Home Equity Line of Credit', 'HELOC', False, True, True, 'PRIME', 1.0, 60, 240, 10000, 500000),
        ('CREDIT_CARD_REWARDS', 'Rewards Credit Card', 'CREDIT_CARD', True, False, False, 'PRIME', 9.99, 1, 1, 500, 25000),
        ('CREDIT_CARD_BASIC', 'Basic Credit Card', 'CREDIT_CARD', True, False, False, 'PRIME', 14.99, 1, 1, 500, 10000),
        ('BUSINESS_TERM', 'Business Term Loan', 'BUSINESS', False, False, False, 'PRIME', 2.5, 12, 84, 10000, 500000),
        ('BUSINESS_LOC', 'Business Line of Credit', 'BUSINESS', False, False, False, 'PRIME', 3.0, 12, 12, 5000, 250000),
        ('PERSONAL_SECURED', 'Secured Personal Loan', 'PERSONAL', True, False, False, 'PRIME', 2.0, 12, 48, 500, 25000),
    ]

    rows = []
    for p in products:
        rows.append({
            'product_id': str(uuid.uuid4()),
            'product_code': p[0],
            'product_name': p[1],
            'product_category': p[2],
            'is_mla_covered': p[3],
            'is_hmda_reportable': p[4],
            'is_cra_eligible': p[5],
            'rate_index': p[6],
            'rate_spread': p[7],
            'min_term_months': p[8],
            'max_term_months': p[9],
            'min_amount': p[10],
            'max_amount': p[11],
            'active': True,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'loan_products')
    mark_done('loan_products')
    print(f"  inserted {len(df)} rows into loan_products")


def generate_share_products(conn):
    if is_done('share_products'):
        print("share_products already done, skipping.")
        return
    print("Generating share_products...")

    products = [
        ('FREE_CHECKING', 'Free Checking Account', 'CHECKING', 0.0001, 0.0001, 0),
        ('PREMIUM_CHECKING', 'Premium Checking Account', 'CHECKING', 0.0005, 0.0005, 500),
        ('REGULAR_SAVINGS', 'Regular Savings Account', 'SAVINGS', 0.0005, 0.0005, 5),
        ('MONEY_MARKET', 'Money Market Account', 'MONEY_MARKET', 0.0015, 0.0015, 2500),
        ('CERT_12MO', '12-Month Certificate', 'CERTIFICATE', 0.005, 0.005, 1000),
        ('CERT_24MO', '24-Month Certificate', 'CERTIFICATE', 0.0075, 0.0075, 1000),
        ('CERT_36MO', '36-Month Certificate', 'CERTIFICATE', 0.01, 0.01, 1000),
        ('IRA_SAVINGS', 'IRA Savings Account', 'IRA', 0.001, 0.001, 0),
        ('HOLIDAY_CLUB', 'Holiday Club Account', 'SAVINGS', 0.0005, 0.0005, 0),
    ]

    rows = []
    for p in products:
        rows.append({
            'product_id': str(uuid.uuid4()),
            'product_code': p[0],
            'product_name': p[1],
            'product_category': p[2],
            'dividend_rate': p[3],
            'apy': p[4],
            'min_balance': p[5],
            'is_insured': True,
            'active': True,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'share_products')
    mark_done('share_products')
    print(f"  inserted {len(df)} rows into share_products")


def generate_rate_environment(conn):
    if is_done('rate_environment'):
        print("rate_environment already done, skipping.")
        return
    print("Generating rate_environment...")

    # Monthly dates Jan 2020 - Oct 2026 (82 months)
    months = pd.date_range('2020-01-01', '2026-10-01', freq='MS')

    # Fed funds rate by month (key inflection points)
    fed_rates = {
        '2020-01': 1.75, '2020-02': 1.75, '2020-03': 0.08, '2020-04': 0.08,
        '2020-05': 0.08, '2020-06': 0.08, '2020-07': 0.08, '2020-08': 0.08,
        '2020-09': 0.08, '2020-10': 0.08, '2020-11': 0.08, '2020-12': 0.08,
        '2021-01': 0.08, '2021-02': 0.08, '2021-03': 0.08, '2021-04': 0.08,
        '2021-05': 0.08, '2021-06': 0.08, '2021-07': 0.08, '2021-08': 0.08,
        '2021-09': 0.08, '2021-10': 0.08, '2021-11': 0.08, '2021-12': 0.08,
        '2022-01': 0.08, '2022-02': 0.08, '2022-03': 0.33, '2022-04': 0.33,
        '2022-05': 0.83, '2022-06': 1.58, '2022-07': 2.33, '2022-08': 2.33,
        '2022-09': 3.08, '2022-10': 3.08, '2022-11': 3.83, '2022-12': 4.33,
        '2023-01': 4.58, '2023-02': 4.58, '2023-03': 4.83, '2023-04': 4.83,
        '2023-05': 5.08, '2023-06': 5.08, '2023-07': 5.33, '2023-08': 5.33,
        '2023-09': 5.33, '2023-10': 5.33, '2023-11': 5.33, '2023-12': 5.33,
        '2024-01': 5.33, '2024-02': 5.33, '2024-03': 5.33, '2024-04': 5.33,
        '2024-05': 5.33, '2024-06': 5.33, '2024-07': 5.33, '2024-08': 5.33,
        '2024-09': 5.08, '2024-10': 5.08, '2024-11': 4.83, '2024-12': 4.58,
        '2025-01': 4.33, '2025-02': 4.33, '2025-03': 4.33, '2025-04': 4.08,
        '2025-05': 4.08, '2025-06': 4.08, '2025-07': 3.83, '2025-08': 3.83,
        '2025-09': 3.83, '2025-10': 3.58, '2025-11': 3.58, '2025-12': 3.58,
        '2026-01': 3.33, '2026-02': 3.33, '2026-03': 3.33, '2026-04': 3.08,
        '2026-05': 3.08, '2026-06': 3.08, '2026-07': 3.08, '2026-08': 3.08,
        '2026-09': 3.08, '2026-10': 3.08,
    }

    rows = []
    prev_fed = None
    for ts in months:
        mk = ts.strftime('%Y-%m')
        fed = fed_rates.get(mk, 1.75)
        prime = fed + 3.0
        sofr = max(0.01, fed - 0.05)
        t1yr = fed + 0.1
        # Yield curve: inverted 2022-2023
        is_inverted = '2022-03' <= mk <= '2023-12'
        t2yr = fed + (0.15 if not is_inverted else -0.1)
        t5yr = fed + (0.5 if not is_inverted else -0.3)
        t10yr = fed + (0.8 if not is_inverted else -0.5)
        t30yr = fed + (1.1 if not is_inverted else -0.3)
        fhlb = sofr + 0.15
        slope = t10yr - t2yr
        bps = int((fed - prev_fed) * 100) if prev_fed is not None else 0
        rows.append({
            'rate_id': str(uuid.uuid4()),
            'rate_date': ts.date().strftime('%Y-%m-%d'),
            'fed_funds_rate': round(fed, 4),
            'prime_rate': round(prime, 4),
            'sofr_rate': round(sofr, 4),
            'treasury_1yr': round(t1yr, 4),
            'treasury_2yr': round(t2yr, 4),
            'treasury_5yr': round(t5yr, 4),
            'treasury_10yr': round(t10yr, 4),
            'treasury_30yr': round(t30yr, 4),
            'fhlb_advance_rate_1yr': round(fhlb, 4),
            'yield_curve_slope': round(slope, 4),
            'rate_change_basis_points': bps,
        })
        prev_fed = fed

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'rate_environment')
    mark_done('rate_environment')
    print(f"  inserted {len(df)} rows into rate_environment")


def generate_kpi_registry(conn):
    if is_done('kpi_registry'):
        print("kpi_registry already done, skipping.")
        return
    print("Generating kpi_registry...")

    kpis = [
        ('NET_INTEREST_MARGIN', 'Net Interest Margin', 'FINANCE', ['fiona','sylvia','timothy'], '%', 3.0, 2.5, 2.0, True),
        ('CAPITAL_RATIO', 'Capital Adequacy Ratio', 'FINANCE', ['sylvia','timothy'], '%', 10.0, 7.0, 6.0, True),
        ('DELINQUENCY_RATE', 'Loan Delinquency Rate', 'RISK', ['fiona','sylvia','timothy'], '%', 2.0, 4.0, 5.0, False),
        ('CHARGE_OFF_RATE', 'Net Charge-Off Rate', 'RISK', ['fiona','sylvia'], '%', 0.5, 1.0, 1.5, False),
        ('EFFICIENCY_RATIO', 'Efficiency Ratio', 'FINANCE', ['sylvia','timothy'], '%', 68.0, 75.0, 80.0, False),
        ('ROA', 'Return on Assets', 'FINANCE', ['sylvia','timothy'], '%', 0.9, 0.6, 0.4, True),
        ('LOAN_TO_SHARE_RATIO', 'Loan-to-Share Ratio', 'FINANCE', ['fiona','sylvia'], '%', 80.0, 90.0, 95.0, False),
        ('LIQUIDITY_RATIO', 'Liquidity Coverage Ratio', 'RISK', ['fiona','sylvia'], '%', 15.0, 10.0, 8.0, True),
        ('FAIR_LENDING_DISPARITY_INDEX', 'Fair Lending Disparity Index', 'COMPLIANCE', ['evelyn','nadia'], 'ratio', 1.1, 1.2, 1.3, False),
        ('BSA_CASE_RESOLUTION_RATE', 'BSA Case Resolution Rate', 'COMPLIANCE', ['evelyn','nadia'], '%', 90.0, 80.0, 70.0, True),
        ('HMDA_ERROR_RATE', 'HMDA Error Rate', 'COMPLIANCE', ['evelyn','nadia'], '%', 2.0, 5.0, 8.0, False),
        ('EXAM_READINESS_SCORE', 'Exam Readiness Score', 'COMPLIANCE', ['evelyn','sylvia'], '%', 85.0, 70.0, 60.0, True),
        ('MEMBER_GROWTH_RATE', 'Member Growth Rate', 'MEMBER', ['timothy','sylvia'], '%', 3.0, 1.0, 0.0, True),
        ('DIGITAL_ADOPTION_RATE', 'Digital Adoption Rate', 'OPERATIONAL', ['timothy'], '%', 65.0, 50.0, 40.0, True),
        ('NPS_SCORE', 'Net Promoter Score', 'MEMBER', ['timothy','sylvia'], 'score', 40.0, 20.0, 0.0, True),
        ('COMPLAINT_RESOLUTION_RATE', 'Complaint Resolution Rate', 'MEMBER', ['evelyn','timothy'], '%', 95.0, 85.0, 75.0, True),
        ('MODIFICATION_RATE', 'Loan Modification Rate', 'RISK', ['fiona','evelyn'], '%', 2.0, 5.0, 8.0, False),
        ('ALLL_COVERAGE_RATIO', 'ALLL Coverage Ratio', 'RISK', ['fiona','sylvia'], '%', 1.2, 1.0, 0.8, True),
        ('CERTIFICATE_MATURITY_30D', 'Certificates Maturing in 30 Days', 'FINANCE', ['fiona'], '$M', 10.0, 20.0, 30.0, False),
        ('MLA_COMPLIANCE_RATE', 'MLA Compliance Rate', 'COMPLIANCE', ['evelyn','nadia'], '%', 99.0, 97.0, 95.0, True),
        ('SCRA_COMPLIANCE_RATE', 'SCRA Compliance Rate', 'COMPLIANCE', ['evelyn','nadia'], '%', 99.0, 97.0, 95.0, True),
        ('ADVERSE_ACTION_TIMELINESS', 'Adverse Action Notice Timeliness', 'COMPLIANCE', ['evelyn','nadia'], '%', 98.0, 95.0, 90.0, True),
        ('VENDOR_ASSESSMENT_COMPLIANCE', 'Vendor Assessment Compliance', 'COMPLIANCE', ['evelyn'], '%', 95.0, 85.0, 75.0, True),
        ('TRAINING_COMPLETION_RATE', 'Training Completion Rate', 'COMPLIANCE', ['evelyn'], '%', 95.0, 85.0, 75.0, True),
        ('LOAN_OFFICER_EXCEPTION_RATE', 'Loan Officer Exception Rate', 'COMPLIANCE', ['evelyn','nadia'], '%', 5.0, 10.0, 15.0, False),
        ('NIM_BUDGET_VARIANCE', 'NIM vs Budget Variance', 'FINANCE', ['fiona','sylvia'], 'bps', -10.0, -25.0, -40.0, True),
        ('DEPOSIT_GROWTH_RATE', 'Deposit Growth Rate', 'FINANCE', ['fiona','sylvia'], '%', 4.0, 2.0, 0.0, True),
        ('NEW_MEMBER_ACQUISITION_RATE', 'New Member Acquisition Rate', 'MEMBER', ['timothy'], '%', 5.0, 2.0, 1.0, True),
        ('PRODUCT_DEPTH_RATIO', 'Products per Member', 'MEMBER', ['timothy','sylvia'], 'products/member', 2.5, 1.8, 1.2, True),
        ('SHUTDOWN_DEPOSIT_SENSITIVITY', 'Shutdown Deposit Sensitivity', 'RISK', ['timothy','sylvia'], '%', 5.0, 10.0, 15.0, False),
    ]

    rows = []
    for k in kpis:
        rows.append({
            'kpi_id': str(uuid.uuid4()),
            'kpi_code': k[0],
            'kpi_name': k[1],
            'kpi_category': k[2],
            'persona_audience': '{' + ','.join(k[3]) + '}',
            'calculation_logic': f"Computed from source tables",
            'data_sources': '{loan_accounts,share_accounts,income_statement_monthly}',
            'unit': k[4],
            'threshold_green': k[5],
            'threshold_yellow': k[6],
            'threshold_red': k[7],
            'higher_is_better': k[8],
            'active': True,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'kpi_registry')
    mark_done('kpi_registry')
    print(f"  inserted {len(df)} rows into kpi_registry")


def generate_exam_cycles(conn):
    if is_done('exam_cycles'):
        print("exam_cycles already done, skipping.")
        return
    print("Generating exam_cycles...")

    camel_by_year = {2020: 2, 2021: 2, 2022: 2, 2023: 3, 2024: 2, 2025: 2, 2026: None}
    rows = []

    for yr in range(2020, 2027):
        camel = camel_by_year.get(yr)
        status = 'REPORT_ISSUED' if yr < 2026 else 'SCHEDULED'
        component = json.dumps({'C': camel or 2, 'A': camel or 2, 'M': camel or 2,
                                 'E': camel or 2, 'L': camel or 2, 'S': camel or 2}) if camel else None
        rows.append({
            'exam_id': str(uuid.uuid4()),
            'exam_type': 'NCUA',
            'exam_year': yr,
            'exam_start_date': f'{yr}-03-15',
            'exam_end_date': f'{yr}-04-05',
            'examiner_agency': 'NCUA',
            'lead_examiner': f'Examiner {yr}',
            'scope': '{FAIR_LENDING,BSA,TRID,HMDA,CAPITAL}',
            'camel_rating': camel,
            'component_ratings': component,
            'exam_status': status,
        })
        # Internal audit
        rows.append({
            'exam_id': str(uuid.uuid4()),
            'exam_type': 'INTERNAL_AUDIT',
            'exam_year': yr,
            'exam_start_date': f'{yr}-09-01',
            'exam_end_date': f'{yr}-09-30',
            'examiner_agency': 'Internal Audit',
            'lead_examiner': f'Internal Auditor',
            'scope': '{FAIR_LENDING,BSA,TRID,HMDA}',
            'camel_rating': None,
            'component_ratings': None,
            'exam_status': 'REPORT_ISSUED' if yr < 2026 else 'SCHEDULED',
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'exam_cycles')
    mark_done('exam_cycles')
    print(f"  inserted {len(df)} rows into exam_cycles")


def generate_rate_scenarios(conn):
    if is_done('rate_scenarios'):
        print("rate_scenarios already done, skipping.")
        return
    print("Generating rate_scenarios...")

    scenarios = [
        ('BASE', 'BASE', 0, 'Current base case rate scenario'),
        ('GOVERNMENT_SHUTDOWN', 'CUSTOM', 0, 'Federal government shutdown scenario with no immediate rate impact'),
        ('PANDEMIC_LIKE', 'CUSTOM', -150, 'COVID-like emergency with emergency rate cuts'),
        ('ZERO_RATE_ENV', 'FLAT', -150, 'Near-zero interest rate environment'),
        ('RATE_HIKE_CYCLE', 'UP400', 400, '400bps rate hike cycle over 18 months'),
        ('MILITARY_SURGE', 'CUSTOM', 0, 'Major military deployment surge affecting SCRA coverage'),
        ('DEBT_CEILING_CRISIS', 'CUSTOM', 50, 'Debt ceiling standoff causing short-term rate spike'),
        ('BANKING_SECTOR_STRESS', 'CUSTOM', -50, 'Regional banking stress with flight to safety'),
        ('CONGRESSIONAL_TRANSITION', 'CUSTOM', 0, 'Major congressional transition with policy uncertainty'),
    ]

    rows = []
    for s in scenarios:
        rows.append({
            'scenario_id': str(uuid.uuid4()),
            'scenario_name': s[0],
            'scenario_type': s[1],
            'created_date': '2020-01-01',
            'rate_shock_basis_points': s[2],
            'description': s[3],
            'active': True,
            'created_by': None,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'rate_scenarios')
    mark_done('rate_scenarios')
    print(f"  inserted {len(df)} rows into rate_scenarios")


def generate_gl_accounts(conn):
    if is_done('general_ledger_account'):
        print("general_ledger_account already done, skipping.")
        return
    print("Generating general_ledger_account...")

    accounts = [
        # Assets
        ('1000', 'Cash and Cash Equivalents', 'ASSET', 'CASH', 'DEBIT', None, True),
        ('1100', 'Investment Securities', 'ASSET', 'INVESTMENT', 'DEBIT', None, True),
        ('1200', 'Net Loans', 'ASSET', 'LOAN', 'DEBIT', None, True),
        ('1210', 'Mortgage Loans', 'ASSET', 'LOAN', 'DEBIT', '1200', False),
        ('1220', 'Auto Loans', 'ASSET', 'LOAN', 'DEBIT', '1200', False),
        ('1230', 'Personal Loans', 'ASSET', 'LOAN', 'DEBIT', '1200', False),
        ('1240', 'HELOC', 'ASSET', 'LOAN', 'DEBIT', '1200', False),
        ('1250', 'Credit Card Loans', 'ASSET', 'LOAN', 'DEBIT', '1200', False),
        ('1300', 'Allowance for Loan Losses', 'ASSET', 'ALLL', 'CREDIT', '1200', False),
        ('1400', 'Fixed Assets', 'ASSET', 'FIXED', 'DEBIT', None, False),
        ('1500', 'Other Assets', 'ASSET', 'OTHER', 'DEBIT', None, False),
        # Liabilities
        ('2000', 'Total Share Deposits', 'LIABILITY', 'DEPOSIT', 'CREDIT', None, True),
        ('2100', 'Checking Deposits', 'LIABILITY', 'DEPOSIT', 'CREDIT', '2000', False),
        ('2200', 'Savings Deposits', 'LIABILITY', 'DEPOSIT', 'CREDIT', '2000', False),
        ('2300', 'Certificate Deposits', 'LIABILITY', 'DEPOSIT', 'CREDIT', '2000', False),
        ('2350', 'Money Market Deposits', 'LIABILITY', 'DEPOSIT', 'CREDIT', '2000', False),
        ('2400', 'Borrowings', 'LIABILITY', 'BORROWING', 'CREDIT', None, True),
        ('2500', 'FHLB Advances', 'LIABILITY', 'BORROWING', 'CREDIT', '2400', False),
        ('2600', 'Other Liabilities', 'LIABILITY', 'OTHER', 'CREDIT', None, False),
        ('2700', 'Accrued Liabilities', 'LIABILITY', 'ACCRUED', 'CREDIT', None, False),
        # Equity
        ('3000', 'Retained Earnings', 'EQUITY', 'RETAINED', 'CREDIT', None, False),
        ('3100', 'Undivided Earnings', 'EQUITY', 'UNDIVIDED', 'CREDIT', None, False),
        # Income
        ('4000', 'Total Interest Income', 'INCOME', 'INTEREST', 'CREDIT', None, True),
        ('4100', 'Loan Interest Income', 'INCOME', 'INTEREST', 'CREDIT', '4000', False),
        ('4110', 'Mortgage Interest', 'INCOME', 'INTEREST', 'CREDIT', '4100', False),
        ('4120', 'Auto Loan Interest', 'INCOME', 'INTEREST', 'CREDIT', '4100', False),
        ('4200', 'Investment Interest Income', 'INCOME', 'INTEREST', 'CREDIT', '4000', False),
        ('4300', 'Fee Income', 'INCOME', 'FEE', 'CREDIT', None, True),
        ('4310', 'Origination Fees', 'INCOME', 'FEE', 'CREDIT', '4300', False),
        ('4320', 'Late Fees', 'INCOME', 'FEE', 'CREDIT', '4300', False),
        ('4330', 'Service Charges', 'INCOME', 'FEE', 'CREDIT', '4300', False),
        ('4340', 'NSF Fees', 'INCOME', 'FEE', 'CREDIT', '4300', False),
        ('4400', 'Other Non-Interest Income', 'INCOME', 'OTHER', 'CREDIT', None, False),
        # Expenses
        ('5000', 'Total Interest Expense', 'EXPENSE', 'INTEREST', 'DEBIT', None, True),
        ('5100', 'Deposit Dividends', 'EXPENSE', 'INTEREST', 'DEBIT', '5000', False),
        ('5200', 'Borrowing Interest', 'EXPENSE', 'INTEREST', 'DEBIT', '5000', False),
        ('5300', 'Provision for Loan Loss', 'EXPENSE', 'PROVISION', 'DEBIT', None, False),
        ('5400', 'Compensation Expense', 'EXPENSE', 'OPERATING', 'DEBIT', None, False),
        ('5500', 'Occupancy Expense', 'EXPENSE', 'OPERATING', 'DEBIT', None, False),
        ('5600', 'Technology Expense', 'EXPENSE', 'OPERATING', 'DEBIT', None, False),
        ('5700', 'Other Operating Expense', 'EXPENSE', 'OPERATING', 'DEBIT', None, False),
    ]

    # First pass: assign UUIDs, build code->uuid map
    acct_ids = {a[0]: str(uuid.uuid4()) for a in accounts}

    rows = []
    for a in accounts:
        parent_id = acct_ids.get(a[6]) if a[6] else None
        rows.append({
            'gl_account_id': acct_ids[a[0]],
            'account_number': a[0],
            'account_name': a[1],
            'account_type': a[2],
            'sub_type': a[3],
            'normal_balance': a[4],
            'parent_account_id': parent_id,
            'is_summary': a[7] if len(a) > 7 else False,
            'budget_annual': None,
            'active': True,
        })

    # Must insert parents before children - sort by parent_account_id nulls first
    rows_no_parent = [r for r in rows if r['parent_account_id'] is None]
    rows_with_parent = [r for r in rows if r['parent_account_id'] is not None]

    df1 = pd.DataFrame(rows_no_parent)
    copy_df_to_table(conn, df1, 'general_ledger_account')
    df2 = pd.DataFrame(rows_with_parent)
    copy_df_to_table(conn, df2, 'general_ledger_account')
    mark_done('general_ledger_account')
    print(f"  inserted {len(rows)} rows into general_ledger_account")


def run():
    conn = get_conn()
    generate_fiscal_calendar(conn)
    generate_loan_products(conn)
    generate_share_products(conn)
    generate_rate_environment(conn)
    generate_kpi_registry(conn)
    generate_exam_cycles(conn)
    generate_rate_scenarios(conn)
    generate_gl_accounts(conn)
    conn.close()
    print("Wave 1 seeds complete.")


if __name__ == '__main__':
    run()
