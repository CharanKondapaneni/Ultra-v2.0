"""wave6: analytics layer — kpi_current, ml_scenario_results, signals, data_lineage_map"""
import uuid
import random
import pandas as pd
import numpy as np
from utils import get_conn, copy_df_to_table, fetch_rows, is_done, mark_done
from config import SCENARIO_PERIODS

random.seed(700)
np.random.seed(700)

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
COVID_MONTHS = {str(d.date())[:7] for d, sp in SMAP.items() if sp == 'COVID_EMERGENCY'}
SHUTDOWN_MONTHS = {str(d.date())[:7] for d, sp in SMAP.items() if sp == 'GOVERNMENT_SHUTDOWN'}
ZERO_RATE_MONTHS = {str(d.date())[:7] for d, sp in SMAP.items() if sp == 'ZERO_RATE_ENV'}
HIKE_MONTHS = {str(d.date())[:7] for d, sp in SMAP.items() if sp == 'RATE_HIKE_CYCLE'}
POST_COVID_MONTHS = {str(d.date())[:7] for d, sp in SMAP.items() if sp == 'POST_PANDEMIC_NORMALIZATION'}


def generate_kpi_current(conn):
    if is_done('kpi_current'):
        print("kpi_current already done, skipping.")
        return
    print("Generating kpi_current...")

    kpis = fetch_rows(conn,
        "SELECT kpi_id, kpi_code, kpi_category, threshold_green, threshold_yellow, threshold_red, higher_is_better FROM kpi_registry WHERE active=TRUE")

    # Try to get actual values from source tables
    income_data = fetch_rows(conn,
        "SELECT statement_month, nim, efficiency_ratio, roa FROM income_statement_monthly ORDER BY statement_month")
    income_map = {str(r['statement_month'])[:7]: r for r in income_data}

    cap_data = fetch_rows(conn,
        "SELECT snapshot_date, net_worth_ratio, loan_to_share_ratio, liquidity_ratio FROM capital_liquidity_snapshot ORDER BY snapshot_date")
    cap_map = {str(r['snapshot_date'])[:7]: r for r in cap_data}

    nps_data = fetch_rows(conn,
        "SELECT snapshot_date, nps_score FROM nps_snapshot WHERE segment='ALL' AND channel='ALL' ORDER BY snapshot_date")
    nps_map = {str(r['snapshot_date'])[:7]: r for r in nps_data}

    months = pd.date_range('2020-01-01', '2026-10-01', freq='MS')

    # Base value generators per KPI code
    def get_base_value(kpi_code, mk, yr_frac):
        is_covid = mk in COVID_MONTHS
        is_shutdown = mk in SHUTDOWN_MONTHS
        is_zero_rate = mk in ZERO_RATE_MONTHS
        is_hike = mk in HIKE_MONTHS
        is_post_covid = mk in POST_COVID_MONTHS

        code_values = {
            'NET_INTEREST_MARGIN': lambda: float(income_map.get(mk, {}).get('nim') or (2.6 if is_zero_rate else 3.8 if is_hike else 3.2)) * 100,
            'CAPITAL_RATIO': lambda: float(cap_map.get(mk, {}).get('net_worth_ratio') or 0.105) * 100,
            'DELINQUENCY_RATE': lambda: 1.5 * (0.6 if is_covid else 1.9 if is_post_covid else 1.6 if is_shutdown else 1.0) * random.uniform(0.9, 1.1),
            'CHARGE_OFF_RATE': lambda: 0.4 * (0.8 if is_covid else 1.6 if is_post_covid else 1.0) * random.uniform(0.85, 1.15),
            'EFFICIENCY_RATIO': lambda: float(income_map.get(mk, {}).get('efficiency_ratio') or 0.71) * 100,
            'ROA': lambda: float(income_map.get(mk, {}).get('roa') or 0.009) * 100,
            'LOAN_TO_SHARE_RATIO': lambda: float(cap_map.get(mk, {}).get('loan_to_share_ratio') or 0.72) * 100,
            'LIQUIDITY_RATIO': lambda: float(cap_map.get(mk, {}).get('liquidity_ratio') or 0.15) * 100,
            'FAIR_LENDING_DISPARITY_INDEX': lambda: 1.05 + random.uniform(-0.05, 0.08),
            'BSA_CASE_RESOLUTION_RATE': lambda: 88 + random.uniform(-5, 7),
            'HMDA_ERROR_RATE': lambda: 3.0 * (1.5 if mk[:4] == '2021' else 1.0) * random.uniform(0.8, 1.2),
            'EXAM_READINESS_SCORE': lambda: 76 + yr_frac * 1.5 + random.uniform(-3, 3),
            'MEMBER_GROWTH_RATE': lambda: 2.5 + yr_frac * 0.1 + random.uniform(-1, 1),
            'DIGITAL_ADOPTION_RATE': lambda: min(72, 40 + yr_frac * 3.5),
            'NPS_SCORE': lambda: float((nps_map.get(mk) or {}).get('nps_score') or (28 if (is_covid or is_shutdown) else 42)),
            'COMPLAINT_RESOLUTION_RATE': lambda: 92 + random.uniform(-4, 4),
            'MODIFICATION_RATE': lambda: 1.5 * (10.0 if is_covid else 2.2 if is_shutdown else 1.0) * random.uniform(0.8, 1.2),
            'ALLL_COVERAGE_RATIO': lambda: 1.1 + random.uniform(-0.05, 0.15),
            'CERTIFICATE_MATURITY_30D': lambda: random.uniform(5, 25),
            'MLA_COMPLIANCE_RATE': lambda: 99.0 + random.uniform(-0.5, 0.5),
            'SCRA_COMPLIANCE_RATE': lambda: 99.2 + random.uniform(-0.5, 0.3),
            'ADVERSE_ACTION_TIMELINESS': lambda: 96 + random.uniform(-2, 2),
            'VENDOR_ASSESSMENT_COMPLIANCE': lambda: 90 + random.uniform(-5, 5),
            'TRAINING_COMPLETION_RATE': lambda: 88 + random.uniform(-5, 7),
            'LOAN_OFFICER_EXCEPTION_RATE': lambda: 6 + random.uniform(-2, 3),
            'NIM_BUDGET_VARIANCE': lambda: random.uniform(-30, 15),
            'DEPOSIT_GROWTH_RATE': lambda: 3.5 * (1.25 if mk in {m for m in SMAP.values() if m == 'STIMULUS_ACTIVE'} else 0.9 if is_shutdown else 1.0) + random.uniform(-1, 1),
            'NEW_MEMBER_ACQUISITION_RATE': lambda: 3.0 + random.uniform(-1, 1.5),
            'PRODUCT_DEPTH_RATIO': lambda: 2.0 + yr_frac * 0.05 + random.uniform(-0.1, 0.1),
            'SHUTDOWN_DEPOSIT_SENSITIVITY': lambda: 8 if is_shutdown else 3 + random.uniform(-1, 2),
        }
        fn = code_values.get(kpi_code)
        return round(fn(), 4) if fn else round(random.uniform(50, 100), 4)

    def get_status(kpi, value):
        g = float(kpi['threshold_green'] or 0)
        y = float(kpi['threshold_yellow'] or 0)
        higher = kpi['higher_is_better']
        if higher:
            if value >= g:
                return 'GREEN'
            elif value >= y:
                return 'YELLOW'
            else:
                return 'RED'
        else:
            if value <= g:
                return 'GREEN'
            elif value <= y:
                return 'YELLOW'
            else:
                return 'RED'

    rows = []
    prev_values = {}

    for month in months:
        mk = month.strftime('%Y-%m')
        date_str = month.date().strftime('%Y-%m-%d')
        yr_frac = (month.year - 2020) + (month.month - 1) / 12

        for kpi in kpis:
            kpi_id = kpi['kpi_id']
            kpi_code = kpi['kpi_code']
            value = get_base_value(kpi_code, mk, yr_frac)
            prev_val = prev_values.get(kpi_id)
            prev_values[kpi_id] = value

            change_abs = round(value - prev_val, 4) if prev_val is not None else 0.0
            change_pct = round(change_abs / prev_val * 100, 4) if (prev_val and prev_val != 0) else 0.0
            trend = 'UP' if change_abs > 0.1 else ('DOWN' if change_abs < -0.1 else 'FLAT')

            status = get_status(kpi, value)
            budget_val = round(value * random.uniform(0.95, 1.05), 4)

            rows.append({
                'current_id': str(uuid.uuid4()),
                'kpi_id': kpi_id,
                'as_of_date': date_str,
                'current_value': value,
                'prior_period_value': prev_val,
                'change_abs': change_abs,
                'change_pct': change_pct,
                'status': status,
                'trend': trend,
                'ytd_value': value,
                'budget_value': budget_val,
                'variance_vs_budget': round(value - budget_val, 4),
                'percentile_vs_peers': round(random.uniform(40, 70), 2),
            })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'kpi_current')
    mark_done('kpi_current')
    print(f"  inserted {len(df)} rows into kpi_current")


def generate_ml_scenario_results(conn):
    if is_done('ml_scenario_results'):
        print("ml_scenario_results already done, skipping.")
        return
    print("Generating ml_scenario_results...")
    scenarios = fetch_rows(conn, "SELECT scenario_id, scenario_name FROM rate_scenarios")
    projection_months_list = [1, 3, 6, 12]
    run_dates = ['2020-01-01','2021-01-01','2022-01-01','2023-01-01','2024-01-01','2025-01-01','2026-01-01']

    # Scenario-specific projected values
    scenario_projections = {
        'BASE': {'nim':3.2,'net_income':2500000,'capital_ratio':10.8,'liquidity':14.0,'loan_growth':0.06,'deposit_growth':0.04,'charge_off':0.006,'efficiency':0.71,'delinquency':0.025,'mod_vol':250},
        'PANDEMIC_LIKE': {'nim':2.4,'net_income':800000,'capital_ratio':9.5,'liquidity':18.0,'loan_growth':0.01,'deposit_growth':0.08,'charge_off':0.012,'efficiency':0.78,'delinquency':0.018,'mod_vol':2500},
        'GOVERNMENT_SHUTDOWN': {'nim':3.1,'net_income':2200000,'capital_ratio':10.5,'liquidity':12.0,'loan_growth':0.03,'deposit_growth':-0.04,'charge_off':0.009,'efficiency':0.73,'delinquency':0.040,'mod_vol':800},
        'ZERO_RATE_ENV': {'nim':2.6,'net_income':1500000,'capital_ratio':10.2,'liquidity':16.0,'loan_growth':0.08,'deposit_growth':0.03,'charge_off':0.005,'efficiency':0.74,'delinquency':0.022,'mod_vol':200},
        'RATE_HIKE_CYCLE': {'nim':3.8,'net_income':3200000,'capital_ratio':11.2,'liquidity':13.0,'loan_growth':-0.01,'deposit_growth':0.06,'charge_off':0.007,'efficiency':0.68,'delinquency':0.028,'mod_vol':300},
        'MILITARY_SURGE': {'nim':3.2,'net_income':2500000,'capital_ratio':10.8,'liquidity':14.0,'loan_growth':0.05,'deposit_growth':0.03,'charge_off':0.006,'efficiency':0.72,'delinquency':0.026,'mod_vol':260},
        'DEBT_CEILING_CRISIS': {'nim':3.3,'net_income':2300000,'capital_ratio':10.5,'liquidity':11.0,'loan_growth':0.02,'deposit_growth':-0.02,'charge_off':0.008,'efficiency':0.73,'delinquency':0.032,'mod_vol':400},
        'BANKING_SECTOR_STRESS': {'nim':3.0,'net_income':2100000,'capital_ratio':10.6,'liquidity':16.5,'loan_growth':0.07,'deposit_growth':0.12,'charge_off':0.007,'efficiency':0.72,'delinquency':0.027,'mod_vol':280},
        'CONGRESSIONAL_TRANSITION': {'nim':3.2,'net_income':2400000,'capital_ratio':10.7,'liquidity':14.0,'loan_growth':0.04,'deposit_growth':0.03,'charge_off':0.006,'efficiency':0.71,'delinquency':0.026,'mod_vol':260},
    }

    rows = []
    for scenario in scenarios:
        s_name = scenario['scenario_name']
        base = scenario_projections.get(s_name, scenario_projections['BASE'])

        for run_date in run_dates:
            for proj_months in projection_months_list:
                # Scale projections by horizon (longer = more uncertainty)
                scale = 1 + (proj_months / 12) * 0.1
                noise = random.uniform(0.95, 1.05)
                val = {k: v * scale * noise for k, v in base.items()}

                ci_range = round(val['nim'] * 0.15, 4)
                rows.append({
                    'result_id': str(uuid.uuid4()),
                    'scenario_id': scenario['scenario_id'],
                    'model_name': f'USSFCU_{s_name}_v1',
                    'run_date': run_date,
                    'projection_months': proj_months,
                    'projected_nim': round(val['nim'] / 100, 4),
                    'projected_net_income': round(val['net_income'], 2),
                    'projected_capital_ratio': round(val['capital_ratio'] / 100, 4),
                    'projected_liquidity_ratio': round(val['liquidity'] / 100, 4),
                    'projected_loan_growth': round(val['loan_growth'], 4),
                    'projected_deposit_growth': round(val['deposit_growth'], 4),
                    'projected_charge_off_rate': round(val['charge_off'], 4),
                    'projected_efficiency_ratio': round(val['efficiency'], 4),
                    'projected_delinquency_rate': round(val['delinquency'], 4),
                    'projected_modification_volume': int(val['mod_vol']),
                    'government_shutdown_included': s_name == 'GOVERNMENT_SHUTDOWN',
                    'confidence_interval_low': round(val['nim'] / 100 - ci_range, 4),
                    'confidence_interval_high': round(val['nim'] / 100 + ci_range, 4),
                })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'ml_scenario_results')
    mark_done('ml_scenario_results')
    print(f"  inserted {len(df)} rows into ml_scenario_results")


def generate_signals(conn):
    if is_done('signals'):
        print("signals already done, skipping.")
        return
    print("Generating signals...")
    staff = fetch_rows(conn, "SELECT staff_id FROM staff WHERE department='Compliance' LIMIT 5")
    staff_ids = [s['staff_id'] for s in staff]

    signals_def = [
        # COVID_EMERGENCY period
        ('2020-04-01', 'ANOMALY', 'HIGH', 'RISK', 'Loan Modification Volume Surge',
         'Monthly modification volume 10x above baseline — COVID forbearance programs activated',
         None, None, 'modification_count', 2500, 250, 'Activate full forbearance workflow',
         ['fiona','sylvia','timothy'], True),
        ('2020-04-15', 'ANOMALY', 'CRITICAL', 'OPERATIONAL', 'Branch Traffic Collapse',
         'Branch transactions down 97% — shift to digital/phone channels',
         None, None, 'branch_traffic_pct', 3, 100,
         'Activate business continuity remote operations',
         ['timothy','sylvia'], True),
        ('2020-05-01', 'PROACTIVE', 'HIGH', 'FINANCE', 'ALLL Provision Requirement',
         'COVID uncertainty requires ALLL overlay increase — recommend $2M additional provision',
         None, None, 'alll_reserve_rate', 1.8, 1.2,
         'Increase provision expense by $2M for Q2',
         ['fiona','sylvia'], True),
        ('2020-07-01', 'PREDICTIVE', 'MEDIUM', 'MEMBER', 'Digital Adoption Acceleration',
         'Digital enrollment up 45% in Q2 2020 — NPS for digital channel outperforming branch',
         None, None, 'digital_adoption_rate', 65, 40,
         'Accelerate digital feature rollout',
         ['timothy'], True),

        # GOVERNMENT_SHUTDOWN period
        ('2026-01-16', 'PROACTIVE', 'HIGH', 'RISK', 'Deposit Withdrawal Spike Beginning',
         'Senate/House SEG deposits declining at 1.4x normal rate — day 2 of shutdown',
         None, None, 'deposit_withdrawal_rate', 1.4, 1.0,
         'Activate payroll advance program, pre-draw FHLB',
         ['sylvia','timothy'], False),
        ('2026-01-20', 'ALERT', 'CRITICAL', 'RISK', 'Delinquency Leading Indicator Rising',
         'Paycheck-dependent members showing early signs of financial stress — monitor daily',
         None, None, 'delinquency_rate', 4.2, 2.0,
         'Monitor 7-day rolling delinquency rate, increase collection outreach',
         ['fiona','sylvia','timothy'], False),
        ('2026-01-21', 'PROACTIVE', 'HIGH', 'MEMBER', 'Payroll Advance Demand Surge',
         '340 members requesting emergency payroll advance — above capacity',
         None, None, 'payroll_advance_requests', 340, 50,
         'Approve expanded payroll advance program up to $5,000 per member',
         ['timothy'], False),

        # RATE_HIKE_CYCLE period
        ('2022-07-01', 'PREDICTIVE', 'HIGH', 'FINANCE', 'NIM Recovery in Progress',
         'Rising rates driving NIM expansion — 3.6% vs 2.8% one year ago',
         None, None, 'nim', 3.6, 2.8,
         'Review floating rate loan repricing schedule',
         ['fiona','sylvia','timothy'], True),
        ('2022-10-01', 'PROACTIVE', 'MEDIUM', 'FINANCE', 'Certificate Demand Surge',
         'Certificate applications up 190% — member seeking rate-competitive products',
         None, None, 'certificate_applications', 190, 100,
         'Launch 24-month certificate promotion at 4.25% APY',
         ['fiona','sylvia'], True),
        ('2023-01-01', 'PREDICTIVE', 'HIGH', 'RISK', 'Mortgage Pipeline Collapse',
         'Mortgage applications down 62% from peak — refi market effectively closed',
         None, None, 'mortgage_app_volume_pct', 38, 100,
         'Reallocate loan officers to auto and personal loan segments',
         ['fiona','sylvia'], True),

        # BANKING_SECTOR_STRESS
        ('2023-03-13', 'PROACTIVE', 'HIGH', 'MEMBER', 'Deposit Inflow Anomaly',
         'Net new members up 250% week-over-week following SVB collapse — FDIC insurance inquiries surging',
         None, None, 'new_member_rate', 2.5, 1.0,
         'Staff member services surge, prepare NCUA coverage messaging',
         ['timothy'], True),

        # MILITARY_SURGE
        ('2020-04-01', 'ALERT', 'HIGH', 'COMPLIANCE', 'SCRA Activation Spike',
         'Military orders activating 3.5x normal rate — SCRA rate cap activation required',
         None, None, 'scra_activation_count', 85, 25,
         'Process all SCRA rate caps within 72 hours of activation notice',
         ['evelyn','nadia'], True),

        # 2026 current period - ACTIVE unresolved signals for AI to surface
        ('2026-10-01', 'ANOMALY', 'CRITICAL', 'RISK', 'Shutdown Deposit Sensitivity Breaching Threshold',
         'Deposit withdrawals from Senate/House SEG at 1.4x baseline — shutdown day 15',
         None, None, 'shutdown_deposit_sensitivity', 8.5, 5.0,
         'Immediately pre-draw FHLB $15M as liquidity buffer',
         ['sylvia','timothy','fiona'], False),
        ('2026-10-05', 'PREDICTIVE', 'HIGH', 'COMPLIANCE', 'Delinquency Forecast Exceeds RED Threshold',
         'ML model predicts delinquency rate reaching 4.2% in 30 days if shutdown continues',
         None, None, 'predicted_delinquency_30d', 4.2, 2.0,
         'Activate proactive outreach to at-risk members',
         ['fiona','sylvia','nadia'], False),
        ('2026-10-10', 'PROACTIVE', 'HIGH', 'FINANCE', 'Certificate Maturity Concentration',
         '$18M in certificates maturing in next 30 days — renewal intent only 40%',
         None, None, 'certificates_maturing_30d', 18.0, 10.0,
         'Launch certificate retention campaign with competitive rates',
         ['fiona'], False),
        ('2026-10-15', 'ALERT', 'MEDIUM', 'COMPLIANCE', 'HMDA Error Rate Elevated',
         'HMDA edit checks showing 4.8% error rate — approaching regulatory threshold',
         None, None, 'hmda_error_rate', 4.8, 2.0,
         'Assign compliance team to HMDA file review and correction',
         ['evelyn','nadia'], False),
        ('2026-10-20', 'PROACTIVE', 'HIGH', 'RISK', 'NIM Budget Variance Warning',
         'NIM tracking 28bps below budget for October — rate environment impact',
         None, None, 'nim_budget_variance', -28, -10,
         'Review rate repricing schedule and deposit cost optimization',
         ['fiona','sylvia'], False),
    ]

    rows = []
    for sig in signals_def:
        (sig_date, sig_type, severity, category, title, desc,
         entity_type, entity_id, metric_name, curr_val, thresh_val,
         rec_action, persona, resolved) = sig

        rows.append({
            'signal_id': str(uuid.uuid4()),
            'signal_date': sig_date,
            'signal_type': sig_type,
            'severity': severity,
            'category': category,
            'title': title,
            'description': desc,
            'affected_entity_type': entity_type,
            'affected_entity_id': entity_id,
            'metric_name': metric_name,
            'current_value': curr_val,
            'threshold_value': thresh_val,
            'recommended_action': rec_action,
            'persona_audience': '{' + ','.join(persona) + '}',
            'acknowledged': resolved,
            'acknowledged_by': random.choice(staff_ids) if staff_ids and resolved else None,
            'acknowledged_at': sig_date + ' 09:00:00' if resolved else None,
            'resolved': resolved,
            'resolved_at': sig_date + ' 17:00:00' if resolved else None,
        })

    # Add additional historical signals (~380 more) across all years
    extra_months = pd.date_range('2020-01-01', '2026-09-01', freq='2MS')
    signal_templates = [
        ('ANOMALY', 'MEDIUM', 'COMPLIANCE', 'Compliance Exception Spike', ['evelyn','nadia']),
        ('PROACTIVE', 'LOW', 'FINANCE', 'Deposit Growth Below Target', ['fiona','sylvia']),
        ('PREDICTIVE', 'MEDIUM', 'RISK', 'Delinquency Trend Monitor', ['fiona','sylvia','timothy']),
        ('ALERT', 'LOW', 'MEMBER', 'NPS Decline Detected', ['timothy']),
        ('ANOMALY', 'MEDIUM', 'FINANCE', 'Fee Income Variance', ['fiona']),
    ]
    for month in extra_months[:75]:
        for tmpl in signal_templates:
            sig_type, severity, category, title, persona = tmpl
            rows.append({
                'signal_id': str(uuid.uuid4()),
                'signal_date': month.date().strftime('%Y-%m-%d'),
                'signal_type': sig_type,
                'severity': severity,
                'category': category,
                'title': f'{title} - {month.strftime("%b %Y")}',
                'description': f'Automated detection: {title.lower()} observed for period {month.strftime("%Y-%m")}',
                'affected_entity_type': None,
                'affected_entity_id': None,
                'metric_name': 'generic_metric',
                'current_value': round(random.uniform(1, 100), 2),
                'threshold_value': round(random.uniform(50, 90), 2),
                'recommended_action': 'Review and assess',
                'persona_audience': '{' + ','.join(persona) + '}',
                'acknowledged': True,
                'acknowledged_by': random.choice(staff_ids) if staff_ids else None,
                'acknowledged_at': month.strftime('%Y-%m-%d') + ' 10:00:00',
                'resolved': True,
                'resolved_at': month.strftime('%Y-%m-%d') + ' 16:00:00',
            })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'signals')
    mark_done('signals')
    print(f"  inserted {len(df)} rows into signals")


def generate_data_lineage_map(conn):
    if is_done('data_lineage_map'):
        print("data_lineage_map already done, skipping.")
        return
    print("Generating data_lineage_map...")

    lineage_entries = [
        ('kpi_current', 'current_value', 'loan_delinquency', 'delinquency_bucket', 'COUNT/GROUP BY delinquency_bucket per month', 'MONTHLY'),
        ('kpi_current', 'current_value', 'loan_accounts', 'loan_status', 'SUM(delinquent) / COUNT(*)', 'MONTHLY'),
        ('kpi_current', 'current_value', 'capital_liquidity_snapshot', 'net_worth_ratio', 'Direct read latest row', 'MONTHLY'),
        ('kpi_current', 'current_value', 'income_statement_monthly', 'nim', 'Direct read from monthly income statement', 'MONTHLY'),
        ('kpi_current', 'current_value', 'income_statement_monthly', 'efficiency_ratio', 'Direct read from monthly income statement', 'MONTHLY'),
        ('kpi_current', 'current_value', 'income_statement_monthly', 'roa', 'Direct read from monthly income statement', 'MONTHLY'),
        ('kpi_current', 'current_value', 'nps_snapshot', 'nps_score', 'Latest segment=ALL channel=ALL row', 'MONTHLY'),
        ('kpi_current', 'current_value', 'complaints', 'status', "COUNT(resolved)/COUNT(*) where status='RESOLVED'", 'MONTHLY'),
        ('kpi_current', 'status', 'kpi_registry', 'threshold_green', 'Compare current_value to thresholds', 'REAL_TIME'),
        ('kpi_current', 'status', 'kpi_registry', 'threshold_yellow', 'Compare current_value to thresholds', 'REAL_TIME'),
        ('signals', 'current_value', 'kpi_current', 'current_value', 'TOP 5 RED/YELLOW KPIs by severity', 'DAILY'),
        ('signals', 'threshold_value', 'kpi_registry', 'threshold_yellow', 'Threshold from KPI definition', 'DAILY'),
        ('business_performance_snapshot', 'nim', 'income_statement_monthly', 'nim', 'Direct copy monthly value', 'MONTHLY'),
        ('business_performance_snapshot', 'total_members', 'members', 'member_id', 'COUNT(*) where status=ACTIVE', 'MONTHLY'),
        ('business_performance_snapshot', 'total_loans_outstanding', 'loan_accounts', 'current_balance', 'SUM(current_balance)', 'MONTHLY'),
        ('business_performance_snapshot', 'total_deposits', 'share_accounts', 'current_balance', 'SUM(current_balance)', 'MONTHLY'),
        ('ml_scenario_results', 'projected_delinquency_rate', 'loan_delinquency', 'delinquency_bucket', 'ML model trained on historical delinquency by scenario', 'DAILY_BATCH'),
        ('ml_scenario_results', 'projected_nim', 'income_statement_monthly', 'nim', 'ML model trained on NIM by rate environment', 'DAILY_BATCH'),
        ('ml_scenario_results', 'projected_deposit_growth', 'seg_deposit_snapshot', 'total_deposit_balance', 'ML model: deposit behavior by scenario type', 'DAILY_BATCH'),
        ('loan_portfolio_snapshot', 'delinquency_rate', 'loan_accounts', 'loan_status', "DELINQUENT/total per product per month", 'MONTHLY'),
        ('loan_portfolio_snapshot', 'avg_rate', 'loan_accounts', 'interest_rate', 'AVG(interest_rate) per product', 'MONTHLY'),
        ('fair_lending_snapshot', 'disparity_index', 'loan_applications', 'race', 'approval_rate(group)/approval_rate(White)', 'MONTHLY'),
        ('kpi_current', 'current_value', 'fair_lending_snapshot', 'disparity_index', 'MAX(disparity_index) across demographics', 'MONTHLY'),
        ('kpi_current', 'current_value', 'exam_readiness_score', 'score_pct', 'AVG score_pct across all areas', 'MONTHLY'),
        ('kpi_current', 'current_value', 'training_completions', 'passed', 'COUNT(passed)/COUNT(*) per month', 'MONTHLY'),
        ('kpi_current', 'current_value', 'bsa_cases', 'status', "COUNT(CLOSED+FILED)/COUNT(*)", 'MONTHLY'),
        ('kpi_current', 'current_value', 'adverse_action_notices', 'timely', 'COUNT(timely=TRUE)/COUNT(*)', 'MONTHLY'),
        ('kpi_current', 'current_value', 'mla_scra_checks', 'mapr_compliant', 'COUNT(compliant)/COUNT(*)', 'MONTHLY'),
        ('kpi_current', 'current_value', 'digital_engagement', 'sessions_count', 'COUNT(members with sessions)/total_active_members', 'MONTHLY'),
        ('kpi_current', 'current_value', 'member_share_of_wallet', 'product_count', 'AVG(product_count) across active members', 'MONTHLY'),
    ]

    rows = []
    for entry in lineage_entries:
        target_tbl, target_col, source_tbl, source_col, transform, freq = entry
        rows.append({
            'lineage_id': str(uuid.uuid4()),
            'target_table': target_tbl,
            'target_column': target_col,
            'source_table': source_tbl,
            'source_column': source_col,
            'transformation_logic': transform,
            'refresh_frequency': freq,
            'last_refreshed_at': '2026-10-31 00:00:00',
            'data_quality_score': round(random.uniform(0.92, 0.99), 4),
            'row_count': random.randint(1000, 500000),
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'data_lineage_map')
    mark_done('data_lineage_map')
    print(f"  inserted {len(df)} rows into data_lineage_map")


def run():
    conn = get_conn()
    generate_kpi_current(conn)
    generate_ml_scenario_results(conn)
    generate_signals(conn)
    generate_data_lineage_map(conn)
    conn.close()
    print("Wave 6 analytics complete.")


if __name__ == '__main__':
    run()
