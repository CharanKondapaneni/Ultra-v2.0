"""wave4e: strategic and supplemental tables — initiatives, strategic_projections, employer_financial_health,
playbook_actions, succession_planning, peer_benchmarks, certificate_maturity_schedule"""
import uuid
import random
import pandas as pd
import numpy as np
from faker import Faker
from utils import get_conn, copy_df_to_table, fetch_rows, is_done, mark_done
from config import SCENARIO_PERIODS

fake = Faker()
Faker.seed(500)
random.seed(500)
np.random.seed(500)

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
CR_MONTHS = {str(d.date())[:7] for d, sp in SMAP.items() if sp == 'CONTINUING_RESOLUTION'}


def generate_initiatives(conn):
    if is_done('initiatives'):
        print("initiatives already done, skipping.")
        return
    print("Generating initiatives...")
    staff = fetch_rows(conn, "SELECT staff_id FROM staff WHERE role IN ('ceo','cfo','vp_compliance','vp_lending','vp_operations') LIMIT 5")
    sponsor_ids = [s['staff_id'] for s in staff]

    initiatives_data = [
        ('Core Banking System Upgrade', 'TECHNOLOGY', 2022, '2022-01-01', '2024-12-31', 2000000),
        ('Digital Banking Platform Launch', 'TECHNOLOGY', 2021, '2021-03-01', '2022-06-30', 1200000),
        ('BSA/AML System Replacement', 'COMPLIANCE', 2021, '2021-01-01', '2023-06-30', 850000),
        ('Mobile App Redesign', 'TECHNOLOGY', 2020, '2020-06-01', '2021-06-30', 400000),
        ('HMDA Automation Tool', 'COMPLIANCE', 2021, '2021-04-01', '2022-03-31', 150000),
        ('Member Financial Wellness Program', 'MEMBER_EXPERIENCE', 2022, '2022-01-01', '2026-12-31', 500000),
        ('Branch Modernization Capitol Hill', 'EFFICIENCY', 2023, '2023-01-01', '2024-06-30', 750000),
        ('Cybersecurity Enhancement', 'RISK', 2020, '2020-01-01', '2021-06-30', 600000),
        ('Fair Lending Monitoring Program', 'COMPLIANCE', 2020, '2020-03-01', '2021-06-30', 200000),
        ('Auto Loan Growth Campaign', 'GROWTH', 2021, '2021-01-01', '2022-06-30', 300000),
        ('Payroll Advance Emergency Program', 'MEMBER_EXPERIENCE', 2026, '2026-01-15', '2026-03-31', 100000),
        ('Digital Certificate Renewal Platform', 'TECHNOLOGY', 2023, '2023-06-01', '2024-06-30', 350000),
        ('SCRA Compliance Automation', 'COMPLIANCE', 2020, '2020-06-01', '2021-06-30', 180000),
        ('Commercial Member Expansion', 'GROWTH', 2022, '2022-01-01', '2024-12-31', 450000),
        ('Staff Training LMS Upgrade', 'TECHNOLOGY', 2021, '2021-09-01', '2022-06-30', 220000),
        ('Vendor Risk Management Program', 'RISK', 2020, '2020-01-01', '2021-06-30', 160000),
        ('KPI Dashboard Implementation', 'TECHNOLOGY', 2024, '2024-01-01', '2024-12-31', 280000),
        ('Peer Benchmarking Program', 'EFFICIENCY', 2021, '2021-01-01', '2022-06-30', 90000),
        ('Member Onboarding Digital', 'MEMBER_EXPERIENCE', 2023, '2023-01-01', '2023-12-31', 310000),
        ('Investment Portfolio Optimization', 'EFFICIENCY', 2022, '2022-06-01', '2023-12-31', 120000),
        ('CECL Implementation', 'COMPLIANCE', 2021, '2021-01-01', '2023-01-01', 420000),
        ('API Banking Infrastructure', 'TECHNOLOGY', 2024, '2024-06-01', '2026-06-30', 680000),
        ('Member Retention Campaign', 'MEMBER_EXPERIENCE', 2023, '2023-01-01', '2023-12-31', 250000),
        ('Deposit Growth Initiative', 'GROWTH', 2024, '2024-01-01', '2025-12-31', 380000),
        ('Compliance Training Overhaul', 'COMPLIANCE', 2022, '2022-01-01', '2022-12-31', 140000),
        ('Mortgage Origination Efficiency', 'EFFICIENCY', 2023, '2023-06-01', '2024-12-31', 290000),
        ('Data Analytics Platform', 'TECHNOLOGY', 2024, '2024-01-01', '2026-06-30', 920000),
        ('Climate Risk Assessment', 'RISK', 2025, '2025-01-01', '2026-06-30', 180000),
        ('Digital Identity Verification', 'COMPLIANCE', 2025, '2025-06-01', '2026-12-31', 320000),
        ('Member Advisory Board', 'MEMBER_EXPERIENCE', 2023, '2023-01-01', '2026-12-31', 75000),
    ]

    rows = []
    today = pd.Timestamp('2026-10-31')
    for init in initiatives_data:
        name, itype, yr, start, target, budget = init
        start_dt = pd.Timestamp(start)
        target_dt = pd.Timestamp(target)
        is_completed = target_dt < today
        is_active = not is_completed and start_dt <= today

        if is_completed:
            status = 'COMPLETED'
            comp_pct = 100.0
            actual_comp = target
        elif is_active:
            if random.random() < 0.7:
                status = 'ON_TRACK'
            elif random.random() < 0.5:
                status = 'AT_RISK'
            else:
                status = 'DELAYED'
            months_elapsed = (today - start_dt).days / 30
            total_months = (target_dt - start_dt).days / 30
            comp_pct = round(min(99, months_elapsed / total_months * 100 * random.uniform(0.85, 1.05)), 2)
            actual_comp = None
        else:
            status = 'ON_TRACK'
            comp_pct = 0.0
            actual_comp = None

        spent = round(budget * (comp_pct / 100) * random.uniform(0.85, 1.10), 2)
        rows.append({
            'initiative_id': str(uuid.uuid4()),
            'initiative_name': name,
            'initiative_type': itype,
            'strategic_goal': f'Achieve {name}',
            'fiscal_year': yr,
            'budget_allocated': budget,
            'budget_spent': spent,
            'budget_variance': round(spent - budget, 2),
            'status': status,
            'completion_pct': comp_pct,
            'start_date': start,
            'target_completion': target,
            'actual_completion': actual_comp,
            'sponsor_staff_id': random.choice(sponsor_ids) if sponsor_ids else None,
            'board_reported': random.random() < 0.4,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'initiatives')
    mark_done('initiatives')
    print(f"  inserted {len(df)} rows into initiatives")


def generate_strategic_projections(conn):
    if is_done('strategic_projections'):
        print("strategic_projections already done, skipping.")
        return
    print("Generating strategic_projections...")

    scenarios = ['BASE','OPTIMISTIC','PESSIMISTIC']
    base_assets = {2020:650,2021:665,2022:685,2023:710,2024:740,2025:775,2026:810}
    multipliers = {'BASE':1.0,'OPTIMISTIC':1.06,'PESSIMISTIC':0.94}

    rows = []
    for yr in range(2020, 2027):
        for scenario in scenarios:
            m = multipliers[scenario]
            assets = round(base_assets[yr] * m * 1_000_000, 2)
            loans = round(assets * random.uniform(0.60, 0.68) * m, 2)
            deposits = round(assets * random.uniform(0.78, 0.84) * m, 2)
            nwr = round(random.uniform(0.105, 0.115), 4)
            net_income = round(assets * random.uniform(0.008, 0.012) * m, 2)
            membership = int(12000 * m * (1 + (yr - 2020) * 0.03))
            nim = round(random.uniform(0.028, 0.038) * m, 4)
            eff_ratio = round(random.uniform(0.68, 0.75) / m, 4)
            roa = round(net_income / assets, 4)
            loan_growth = round(random.uniform(0.05, 0.08) * m, 4)
            dep_growth = round(random.uniform(0.04, 0.07) * m, 4)
            shutdown_sensitivity = round(assets * 0.02 * random.uniform(0.8, 1.2), 2)

            rows.append({
                'projection_id': str(uuid.uuid4()),
                'fiscal_year': yr,
                'scenario': scenario,
                'total_assets_projected': assets,
                'total_loans_projected': loans,
                'total_deposits_projected': deposits,
                'net_worth_ratio_projected': nwr,
                'net_income_projected': net_income,
                'membership_projected': membership,
                'nim_projected': nim,
                'efficiency_ratio_projected': eff_ratio,
                'roa_projected': roa,
                'loan_growth_rate': loan_growth,
                'deposit_growth_rate': dep_growth,
                'capital_adequacy_buffer': round(nwr - 0.07, 4),
                'government_shutdown_sensitivity': shutdown_sensitivity,
            })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'strategic_projections')
    mark_done('strategic_projections')
    print(f"  inserted {len(df)} rows into strategic_projections")


def generate_employer_financial_health(conn):
    if is_done('employer_financial_health'):
        print("employer_financial_health already done, skipping.")
        return
    print("Generating employer_financial_health...")
    employers = fetch_rows(conn, "SELECT employer_id, name, employer_type, shutdown_sensitivity FROM employers")
    quarters = pd.date_range('2020-01-01', '2026-10-01', freq='QS')

    base_stability = {
        'US Senate': 9.0, 'US House of Representatives': 9.0,
        'Capitol Police': 8.5, 'Congressional Budget Office': 8.0,
        'Library of Congress': 8.0, 'Government Accountability Office': 8.5,
        'Senate Sergeant at Arms': 8.0, 'House Sergeant at Arms': 8.0,
        'Architect of the Capitol': 7.5, 'Congressional Research Service': 8.0,
        'Booz Allen Hamilton': 7.0, 'Leidos': 6.8, 'SAIC': 6.9,
        'Federal Retirement Thrift Investment Board': 8.5, 'Department of Defense': 9.0,
    }

    rows = []
    for emp in employers:
        for qtr in quarters:
            date_str = qtr.date().strftime('%Y-%m-%d')
            mk = qtr.strftime('%Y-%m')
            is_shutdown = mk in SHUTDOWN_MONTHS
            is_cr = mk in CR_MONTHS
            is_contractor = emp['employer_type'] == 'DIRECT'

            stability = base_stability.get(emp['name'], 7.5)
            stability = round(stability + random.uniform(-0.3, 0.3), 2)
            stability = max(1, min(10, stability))

            if is_shutdown:
                budget_status = 'SHUTDOWN'
                layoff_risk = is_contractor
            elif is_cr:
                budget_status = 'CONTINUING_RESOLUTION'
                layoff_risk = is_contractor and random.random() < 0.3
            elif is_contractor and random.random() < 0.05:
                budget_status = 'SHUTDOWN_RISK'
                layoff_risk = True
            else:
                budget_status = 'ENACTED'
                layoff_risk = is_contractor and random.random() < 0.05

            rows.append({
                'health_id': str(uuid.uuid4()),
                'employer_id': emp['employer_id'],
                'as_of_date': date_str,
                'credit_rating': 'AAA' if emp['employer_type'] in ('SEG','SPONSOR') else random.choice(['AA','A','BBB']),
                'credit_rating_agency': 'SP',
                'financial_stability_score': stability,
                'layoff_risk_flag': layoff_risk,
                'recent_layoff_count': random.randint(50, 500) if layoff_risk else 0,
                'budget_status': budget_status,
                'appropriations_status': budget_status,
                'headcount': random.randint(500, 10000),
                'headcount_change_pct': round(random.uniform(-0.05, 0.05), 4),
                'revenue_annual': None,
                'notes': 'Government shutdown active' if is_shutdown else None,
                'source': 'OPM' if emp['employer_type'] in ('SEG','SPONSOR') else 'PUBLIC_FILING',
            })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'employer_financial_health')
    mark_done('employer_financial_health')
    print(f"  inserted {len(df)} rows into employer_financial_health")


def generate_playbook_actions(conn):
    if is_done('playbook_actions'):
        print("playbook_actions already done, skipping.")
        return
    print("Generating playbook_actions...")
    scenarios = fetch_rows(conn, "SELECT scenario_id, scenario_name FROM rate_scenarios")
    staff = fetch_rows(conn, "SELECT staff_id FROM staff WHERE role IN ('ceo','cfo','vp_compliance','vp_lending','vp_operations') LIMIT 5")
    staff_ids = [s['staff_id'] for s in staff]

    playbooks = {
        'PANDEMIC_LIKE': [
            (1, 'BORROWING_DRAW', 'Pre-draw FHLB capacity $20M as liquidity buffer', 2000000),
            (2, 'LOAN_PROMOTION', 'Activate COVID forbearance and modification workflow', 0),
            (3, 'INVESTMENT_PURCHASE', 'Begin ALLL overlay increase by $2M', 2000000),
            (4, 'DEPOSIT_CAMPAIGN', 'Pause certificate promotional rates', 0),
            (5, 'RATE_REPRICE', 'Notify NCUA of emergency actions per Part 702', 0),
            (6, 'COST_REDUCTION', 'Activate business continuity plan remote operations', 0),
        ],
        'GOVERNMENT_SHUTDOWN': [
            (1, 'LOAN_PROMOTION', 'Activate payroll advance program for affected members', 500000),
            (2, 'COST_REDUCTION', 'Suspend NSF fees for Senate/House SEG members', 0),
            (3, 'DEPOSIT_CAMPAIGN', 'Monitor deposit outflows daily with alert at 3%', 0),
            (4, 'BORROWING_DRAW', 'Pre-position FHLB capacity for liquidity contingency', 10000000),
        ],
        'RATE_HIKE_CYCLE': [
            (1, 'RATE_REPRICE', 'Reprice deposit products to retain members', 0),
            (2, 'INVESTMENT_PURCHASE', 'Extend asset duration to lock in higher yields', 15000000),
            (3, 'DEPOSIT_CAMPAIGN', 'Launch certificate promotion to capture rate-sensitive deposits', 0),
            (4, 'LOAN_PROMOTION', 'Adjust mortgage pipeline expectations downward', 0),
            (5, 'COST_REDUCTION', 'Review NIM hedging strategy with FHLB swaps', 0),
        ],
        'ZERO_RATE_ENV': [
            (1, 'LOAN_PROMOTION', 'Accelerate loan origination to deploy excess liquidity', 0),
            (2, 'INVESTMENT_PURCHASE', 'Extend investment portfolio duration modestly', 20000000),
            (3, 'RATE_REPRICE', 'Reduce deposit costs to maintain NIM floor', 0),
        ],
        'DEBT_CEILING_CRISIS': [
            (1, 'BORROWING_DRAW', 'Pre-position liquidity in case of treasury market disruption', 15000000),
            (2, 'INVESTMENT_PURCHASE', 'Reduce short-term Treasury holdings below June maturity', 0),
            (3, 'DEPOSIT_CAMPAIGN', 'Increase member communication on deposit insurance', 0),
        ],
        'BANKING_SECTOR_STRESS': [
            (1, 'DEPOSIT_CAMPAIGN', 'Activate member acquisition marketing for inflow capture', 0),
            (2, 'BORROWING_DRAW', 'Increase liquidity buffer to handle inflow surge', 10000000),
            (3, 'RATE_REPRICE', 'Review competitive deposit rates to attract new members', 0),
            (4, 'LOAN_PROMOTION', 'Prepare for increased loan demand from switching members', 0),
        ],
        'MILITARY_SURGE': [
            (1, 'LOAN_PROMOTION', 'Activate SCRA proactive outreach to affected members', 0),
            (2, 'COST_REDUCTION', 'Cap MAPR at 6% for all newly activated duty members', 0),
            (3, 'DEPOSIT_CAMPAIGN', 'Extend allotment processing for military pay changes', 0),
        ],
        'CONGRESSIONAL_TRANSITION': [
            (1, 'DEPOSIT_CAMPAIGN', 'Ramp new member onboarding for incoming staff', 0),
            (2, 'LOAN_PROMOTION', 'Target auto loan and personal loan campaign for new employees', 0),
            (3, 'COST_REDUCTION', 'Increase outreach to departing members for retention', 0),
        ],
        'BASE': [
            (1, 'RATE_REPRICE', 'Maintain standard pricing and monitoring', 0),
        ],
    }

    scenario_map = {s['scenario_name']: s['scenario_id'] for s in scenarios}
    rows = []
    for scenario_name, actions in playbooks.items():
        scenario_id = scenario_map.get(scenario_name)
        if not scenario_id:
            continue
        for seq, atype, desc, impact in actions:
            rows.append({
                'action_id': str(uuid.uuid4()),
                'scenario_id': scenario_id,
                'action_sequence': seq,
                'action_type': atype,
                'action_description': desc,
                'projected_impact': impact if impact > 0 else None,
                'trigger_condition': f'When {scenario_name.lower().replace("_"," ")} scenario activated',
                'assigned_to': random.choice(staff_ids) if staff_ids else None,
                'status': 'RECOMMENDED',
                'execution_date': None,
            })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'playbook_actions')
    mark_done('playbook_actions')
    print(f"  inserted {len(df)} rows into playbook_actions")


def generate_succession_planning(conn):
    if is_done('succession_planning'):
        print("succession_planning already done, skipping.")
        return
    print("Generating succession_planning...")
    staff = fetch_rows(conn, "SELECT staff_id, role, department FROM staff WHERE active=TRUE")
    role_map = {}
    for s in staff:
        r = s['role']
        if r not in role_map:
            role_map[r] = []
        role_map[r].append(s['staff_id'])

    critical_roles = [
        ('Chief Executive Officer', 'Executive', 'ceo', 'CRITICAL', 'READY_1YR'),
        ('Chief Financial Officer', 'Finance', 'cfo', 'CRITICAL', 'READY_NOW'),
        ('VP Compliance', 'Compliance', 'vp_compliance', 'CRITICAL', 'READY_2_3YR'),
        ('VP Lending', 'Lending', 'vp_lending', 'HIGH', 'READY_1YR'),
        ('VP Operations', 'Operations', 'vp_operations', 'HIGH', 'READY_1YR'),
        ('BSA Officer Branch 1', 'BSA', 'bsa_officer', 'HIGH', 'READY_NOW'),
        ('BSA Officer Branch 2', 'BSA', 'bsa_officer', 'HIGH', 'READY_2_3YR'),
        ('Branch Manager Capitol Hill', 'Operations', 'branch_manager', 'HIGH', 'READY_1YR'),
        ('Branch Manager Pentagon City', 'Operations', 'branch_manager', 'HIGH', 'READY_NOW'),
        ('Branch Manager Rockville', 'Operations', 'branch_manager', 'MEDIUM', 'READY_2_3YR'),
        ('Branch Manager Alexandria', 'Operations', 'branch_manager', 'MEDIUM', 'NO_SUCCESSOR'),
        ('Chief Audit Officer', 'Internal Audit', 'auditor', 'CRITICAL', 'READY_2_3YR'),
        ('Chief Risk Officer', 'Compliance', 'compliance_officer', 'CRITICAL', 'NO_SUCCESSOR'),
        ('Compliance Officer Lead', 'Compliance', 'compliance_officer', 'HIGH', 'READY_1YR'),
        ('Loan Officer Manager', 'Lending', 'loan_officer_manager', 'MEDIUM', 'READY_NOW'),
    ]

    rows = []
    for role_title, dept, role_code, criticality, readiness in critical_roles:
        incumbents = role_map.get(role_code, [])
        successors = role_map.get('compliance_analyst', []) + role_map.get('finance_analyst', [])
        rows.append({
            'succession_id': str(uuid.uuid4()),
            'role_title': role_title,
            'department': dept,
            'incumbent_staff_id': random.choice(incumbents) if incumbents else None,
            'successor_staff_id': random.choice(successors) if successors and readiness != 'NO_SUCCESSOR' else None,
            'readiness_level': readiness,
            'criticality': criticality,
            'development_plan': 'Leadership development program' if readiness != 'NO_SUCCESSOR' else 'Recruit externally',
            'last_review_date': '2026-04-01',
            'next_review_date': '2027-04-01',
            'board_reported': criticality == 'CRITICAL',
            'status': 'ACTIVE',
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'succession_planning')
    mark_done('succession_planning')
    print(f"  inserted {len(df)} rows into succession_planning")


def generate_peer_benchmarks(conn):
    if is_done('peer_benchmarks'):
        print("peer_benchmarks already done, skipping.")
        return
    print("Generating peer_benchmarks...")
    quarters = pd.date_range('2020-01-01', '2026-10-01', freq='QS')
    metrics = [
        ('net_interest_margin', 'EARNINGS', 3.2, 0.15),
        ('capital_ratio', 'CAPITAL', 10.5, 0.5),
        ('efficiency_ratio', 'EFFICIENCY', 72.0, 2.0),
        ('roa', 'EARNINGS', 0.85, 0.08),
        ('delinquency_rate', 'ASSET_QUALITY', 2.5, 0.3),
        ('charge_off_rate', 'ASSET_QUALITY', 0.6, 0.1),
        ('member_growth_rate', 'GROWTH', 2.5, 0.5),
    ]
    peer_group = 'Federal CUs $500M-$1B Assets'

    rows = []
    ussfcu_pct = {m[0]: 55.0 for m in metrics}

    for qtr in quarters:
        date_str = qtr.date().strftime('%Y-%m-%d')
        yr_frac = (qtr.year - 2020) + (qtr.month - 1) / 12
        for metric_name, cat, peer_med_base, vol in metrics:
            peer_med = round(peer_med_base + random.uniform(-vol, vol), 4)
            peer_top = round(peer_med * 1.10, 4)
            peer_bot = round(peer_med * 0.90, 4)

            # USSFCU value: start at 50th percentile, trend up
            pct = ussfcu_pct[metric_name] + yr_frac * 0.5 + random.uniform(-2, 2)
            pct = max(10, min(90, pct))
            ussfcu_pct[metric_name] = pct
            ussfcu_val = round(peer_bot + (peer_top - peer_bot) * pct / 100, 4)

            trend = 'IMPROVING' if pct > 50 else ('DECLINING' if pct < 40 else 'STABLE')

            rows.append({
                'benchmark_id': str(uuid.uuid4()),
                'benchmark_date': date_str,
                'peer_group': peer_group,
                'metric_name': metric_name,
                'metric_category': cat,
                'ussfcu_value': ussfcu_val,
                'peer_median': peer_med,
                'peer_top_quartile': peer_top,
                'peer_bottom_quartile': peer_bot,
                'percentile_rank': round(pct, 2),
                'trend': trend,
            })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'peer_benchmarks')
    mark_done('peer_benchmarks')
    print(f"  inserted {len(df)} rows into peer_benchmarks")


def generate_certificate_maturity_schedule(conn):
    if is_done('certificate_maturity_schedule'):
        print("certificate_maturity_schedule already done, skipping.")
        return
    print("Generating certificate_maturity_schedule...")
    certs = fetch_rows(conn,
        "SELECT sa.account_id, sa.member_id, sa.current_balance, sa.dividend_rate, sa.apy, "
        "sa.opened_date, sa.maturity_date, sa.seg_id "
        "FROM share_accounts sa "
        "JOIN share_products sp ON sa.product_id=sp.product_id "
        "WHERE sp.product_category='CERTIFICATE' AND sa.account_status='ACTIVE' AND sa.maturity_date IS NOT NULL")

    reference_date = pd.Timestamp('2026-10-31')

    rows = []
    for c in certs:
        mat_dt = pd.Timestamp(str(c['maturity_date']))
        open_dt = pd.Timestamp(str(c['opened_date']))
        days_to_mat = (mat_dt - reference_date).days
        term_months = round((mat_dt - open_dt).days / 30)
        balance = float(c['current_balance'] or 5000)
        rate = float(c['dividend_rate'] or 0.005)
        projected_div = round(balance * rate * (term_months / 12), 2)

        rows.append({
            'schedule_id': str(uuid.uuid4()),
            'account_id': c['account_id'],
            'member_id': c['member_id'],
            'face_amount': balance,
            'dividend_rate': rate,
            'apy': float(c['apy'] or rate),
            'term_months': int(term_months),
            'open_date': str(c['opened_date']),
            'maturity_date': str(c['maturity_date']),
            'days_to_maturity': days_to_mat,
            'projected_dividend': projected_div,
            'renewal_intent': np.random.choice(['RENEW','UNDECIDED','REDEEM'], p=[0.40, 0.35, 0.25]),
            'seg_id': c['seg_id'],
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'certificate_maturity_schedule')
    mark_done('certificate_maturity_schedule')
    print(f"  inserted {len(df)} rows into certificate_maturity_schedule")


def run():
    conn = get_conn()
    generate_initiatives(conn)
    generate_strategic_projections(conn)
    generate_employer_financial_health(conn)
    generate_playbook_actions(conn)
    generate_succession_planning(conn)
    generate_peer_benchmarks(conn)
    generate_certificate_maturity_schedule(conn)
    conn.close()
    print("Wave 4e strategic complete.")


if __name__ == '__main__':
    run()
