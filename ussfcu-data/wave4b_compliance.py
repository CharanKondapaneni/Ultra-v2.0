"""wave4b: compliance tables — cip_documentation, esign_consent, disclosures, changed_circumstances,
hmda_lar_records, procedure_adherence, fair_lending_snapshot, mla_scra_checks, bsa_cases,
complaints, trigger_word_snapshot, compliance_findings, exam_readiness_score, training_completions,
file_exceptions, action_artifacts, regulatory_items"""
import uuid
import random
import pandas as pd
import numpy as np
from faker import Faker
from utils import get_conn, copy_df_to_table, fetch_rows, is_done, mark_done
from config import SCENARIO_PERIODS

fake = Faker()
Faker.seed(200)
random.seed(200)
np.random.seed(200)

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


def generate_cip_documentation(conn):
    if is_done('cip_documentation'):
        print("cip_documentation already done, skipping.")
        return
    print("Generating cip_documentation...")
    members = fetch_rows(conn, "SELECT member_id, membership_date, seg_id, military_status FROM members")
    segs = fetch_rows(conn, "SELECT seg_id, seg_type FROM seg_groups")
    seg_type_map = {s['seg_id']: s['seg_type'] for s in segs}
    staff_ids = [r['staff_id'] for r in fetch_rows(conn, "SELECT staff_id FROM staff LIMIT 20")]

    rows = []
    for m in members:
        seg_type = seg_type_map.get(m['seg_id'], 'SENATE')
        is_military = m['military_status'] in ('ACTIVE_DUTY','RESERVE')
        is_contractor = seg_type == 'CONTRACTOR'
        deficiency_prob = 0.08 if is_contractor else 0.05

        mem_date = pd.Timestamp(str(m['membership_date']))
        verify_dt = mem_date + pd.Timedelta(days=random.randint(0, 5))

        if is_military:
            id_type = np.random.choice(['PASSPORT','DRIVERS_LICENSE','STATE_ID','MILITARY_ID','OTHER'],
                                       p=[0.10, 0.40, 0.10, 0.35, 0.05])
        else:
            id_type = np.random.choice(['PASSPORT','DRIVERS_LICENSE','STATE_ID','MILITARY_ID','OTHER'],
                                       p=[0.15, 0.55, 0.15, 0.05, 0.10])

        deficiency = random.random() < deficiency_prob
        rows.append({
            'cip_id': str(uuid.uuid4()),
            'member_id': m['member_id'],
            'verification_date': verify_dt.date().strftime('%Y-%m-%d'),
            'id_type': id_type,
            'id_number_hash': fake.md5(),
            'id_expiry': fake.date_between(start_date='today', end_date='+10y').strftime('%Y-%m-%d'),
            'verification_method': np.random.choice(['IN_PERSON','DOCUMENTARY','NON_DOCUMENTARY'], p=[0.60,0.30,0.10]),
            'verified_by': random.choice(staff_ids) if staff_ids else None,
            'beneficial_owner_verified': False,
            'pep_flag': random.random() < 0.005,
            'ofac_checked': True,
            'ofac_check_date': verify_dt.date().strftime('%Y-%m-%d'),
            'deficiency_flag': deficiency,
            'deficiency_detail': 'Missing secondary ID' if deficiency else None,
            'remediated': random.random() < 0.80 if deficiency else False,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'cip_documentation')
    mark_done('cip_documentation')
    print(f"  inserted {len(df)} rows into cip_documentation")


def generate_esign_consent(conn):
    if is_done('esign_consent'):
        print("esign_consent already done, skipping.")
        return
    print("Generating esign_consent...")
    loans = fetch_rows(conn,
        "SELECT l.loan_id, l.member_id, l.origination_date FROM loan_accounts l "
        "JOIN members m ON l.member_id=m.member_id WHERE m.digital_enrolled=TRUE")

    rows = []
    seen = set()
    for loan in loans:
        key = (loan['member_id'], str(loan['origination_date'])[:7])
        if key in seen:
            continue
        seen.add(key)
        orig_dt = pd.Timestamp(str(loan['origination_date']))
        consent_dt = orig_dt - pd.Timedelta(days=random.randint(1, 5))
        revoked = random.random() < 0.02
        rows.append({
            'consent_id': str(uuid.uuid4()),
            'member_id': loan['member_id'],
            'loan_id': loan['loan_id'],
            'consent_date': consent_dt.strftime('%Y-%m-%d %H:%M:%S'),
            'consent_method': np.random.choice(['WEBSITE','EMAIL','BRANCH'], p=[0.70,0.20,0.10]),
            'ip_address': fake.ipv4(),
            'device_info': random.choice(['Chrome/Windows','Safari/iPhone','Firefox/Mac','App/Android']),
            'revoked': revoked,
            'revocation_date': (consent_dt + pd.Timedelta(days=random.randint(30, 365))).strftime('%Y-%m-%d %H:%M:%S') if revoked else None,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'esign_consent')
    mark_done('esign_consent')
    print(f"  inserted {len(df)} rows into esign_consent")


def generate_disclosures(conn):
    if is_done('disclosures'):
        print("disclosures already done, skipping.")
        return
    print("Generating disclosures...")
    loans = fetch_rows(conn,
        "SELECT l.loan_id, l.application_id, l.origination_date, l.mla_covered, l.scra_protected, lp.product_category "
        "FROM loan_accounts l JOIN loan_products lp ON l.product_id=lp.product_id")
    apps = fetch_rows(conn, "SELECT application_id, application_date FROM loan_applications")
    app_date_map = {a['application_id']: str(a['application_date']) for a in apps}
    esign_rows = fetch_rows(conn, "SELECT consent_id, loan_id FROM esign_consent")
    esign_map = {e['loan_id']: e['consent_id'] for e in esign_rows}

    disc_type_map = {
        'MORTGAGE': ['TRID_LE','TRID_CD'],
        'HELOC': ['TRID_LE','TRID_CD'],
        'AUTO': ['LOAN_ESTIMATE','CLOSING_DISCLOSURE'],
        'PERSONAL': ['LOAN_ESTIMATE','CLOSING_DISCLOSURE'],
        'CREDIT_CARD': ['CLOSING_DISCLOSURE'],
        'BUSINESS': ['CLOSING_DISCLOSURE'],
    }

    rows = []
    for loan in loans:
        cat = loan['product_category']
        orig_date = str(loan['origination_date'])
        app_date = app_date_map.get(loan['application_id'], orig_date)
        esign_id = esign_map.get(loan['loan_id'])
        disc_types = disc_type_map.get(cat, ['CLOSING_DISCLOSURE'])
        if loan['mla_covered']:
            disc_types = disc_types + ['MLA_DISCLOSURE']
        if loan['scra_protected']:
            disc_types = disc_types + ['SCRA_NOTICE']

        for dt in disc_types:
            if dt == 'TRID_LE':
                req_date = (pd.Timestamp(app_date) + pd.Timedelta(days=3)).date().strftime('%Y-%m-%d')
            elif dt == 'TRID_CD':
                req_date = (pd.Timestamp(orig_date) - pd.Timedelta(days=3)).date().strftime('%Y-%m-%d')
            else:
                req_date = app_date

            timely = random.random() < 0.96
            if timely:
                provided_dt = pd.Timestamp(req_date) + pd.Timedelta(days=random.randint(0, 2))
            else:
                provided_dt = pd.Timestamp(req_date) + pd.Timedelta(days=random.randint(1, 7))

            delivery = np.random.choice(['ELECTRONIC','PAPER','IN_PERSON'], p=[0.65,0.25,0.10])
            ack_prob = 0.95 if delivery == 'ELECTRONIC' else 0.85

            rows.append({
                'disclosure_id': str(uuid.uuid4()),
                'loan_id': loan['loan_id'],
                'application_id': loan['application_id'],
                'disclosure_type': dt,
                'required_date': req_date,
                'provided_date': provided_dt.date().strftime('%Y-%m-%d'),
                'timely': timely,
                'delivery_method': delivery,
                'acknowledged': random.random() < ack_prob,
                'esign_consent_id': esign_id if delivery == 'ELECTRONIC' else None,
            })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'disclosures')
    mark_done('disclosures')
    print(f"  inserted {len(df)} rows into disclosures")


def generate_changed_circumstances(conn):
    if is_done('changed_circumstances'):
        print("changed_circumstances already done, skipping.")
        return
    print("Generating changed_circumstances...")
    apps = fetch_rows(conn,
        "SELECT a.application_id, a.application_date FROM loan_applications a "
        "JOIN loan_products p ON a.product_id=p.product_id "
        "WHERE p.product_category IN ('MORTGAGE','HELOC') AND a.application_status='APPROVED' LIMIT 1200")
    staff_ids = [r['staff_id'] for r in fetch_rows(conn, "SELECT staff_id FROM staff LIMIT 10")]
    change_types = ['BORROWER_REQUEST','INTEREST_RATE_LOCK','VALUE','ELIGIBILITY','OTHER']
    change_weights = [0.30, 0.40, 0.15, 0.10, 0.05]

    rows = []
    for a in apps:
        app_dt = pd.Timestamp(str(a['application_date']))
        change_dt = app_dt + pd.Timedelta(days=random.randint(5, 25))
        rows.append({
            'change_id': str(uuid.uuid4()),
            'application_id': a['application_id'],
            'change_date': change_dt.date().strftime('%Y-%m-%d'),
            'change_type': np.random.choice(change_types, p=change_weights),
            'description': fake.sentence(nb_words=8),
            'revised_le_issued': random.random() < 0.85,
            'revised_le_date': (change_dt + pd.Timedelta(days=2)).date().strftime('%Y-%m-%d'),
            'within_3_days': random.random() < 0.80,
            'created_by': random.choice(staff_ids) if staff_ids else None,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'changed_circumstances')
    mark_done('changed_circumstances')
    print(f"  inserted {len(df)} rows into changed_circumstances")


def generate_hmda_lar_records(conn):
    if is_done('hmda_lar_records'):
        print("hmda_lar_records already done, skipping.")
        return
    print("Generating hmda_lar_records...")
    apps = fetch_rows(conn,
        "SELECT a.application_id, a.application_date, a.application_status, a.application_amount, "
        "a.race, a.ethnicity, a.sex, a.income, a.ltv_ratio, a.dti_ratio "
        "FROM loan_applications a WHERE a.hmda_reportable=TRUE")

    action_map = {
        'APPROVED': 1,
        'DENIED': 3,
        'WITHDRAWN': 4,
        'INCOMPLETE': 5,
    }
    race_code = {'White':5,'Black or African American':3,'Asian':2,'American Indian or Alaska Native':1,'Native Hawaiian':4}
    eth_code = {'Not Hispanic or Latino':2,'Hispanic or Latino':1}
    sex_code = {'Male':1,'Female':2}
    edit_opts = ['PASS','PASS','PASS','PASS','PASS','PASS','PASS','PASS','PASS','WARNING','WARNING','FAIL']

    rows = []
    for i, a in enumerate(apps):
        yr = int(str(a['application_date'])[:4])
        rows.append({
            'lar_id': str(uuid.uuid4()),
            'application_id': a['application_id'],
            'lar_year': yr,
            'lar_sequence': i + 1,
            'action_taken': action_map.get(a['application_status'], 1),
            'action_taken_date': str(a['application_date']),
            'loan_type': 1,
            'loan_purpose': 1,
            'owner_occupancy': 1,
            'loan_amount': float(a['application_amount'] or 250000),
            'property_type': 1,
            'preapproval': 2,
            'census_tract': f'{random.randint(100,999)}.{random.randint(10,99):02d}',
            'msa_md': '47900',
            'state_code': 'DC',
            'county_code': '001',
            'applicant_race_1': race_code.get(str(a['race']), 5),
            'applicant_race_2': None,
            'applicant_ethnicity': eth_code.get(str(a['ethnicity']), 2),
            'applicant_sex': sex_code.get(str(a['sex']), 1),
            'applicant_income': int((a['income'] or 85000) / 1000),
            'purchaser_type': 0,
            'denial_reason_1': 1 if a['application_status'] == 'DENIED' else None,
            'denial_reason_2': None,
            'denial_reason_3': None,
            'rate_spread': round(random.uniform(0.5, 2.5), 4),
            'hoepa_status': 2,
            'lien_status': 1,
            'edit_status': random.choice(edit_opts),
            'submitted': yr < 2026,
            'submission_date': f'{yr+1}-03-01' if yr < 2026 else None,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'hmda_lar_records')
    mark_done('hmda_lar_records')
    print(f"  inserted {len(df)} rows into hmda_lar_records")


def generate_procedure_adherence(conn):
    if is_done('procedure_adherence'):
        print("procedure_adherence already done, skipping.")
        return
    print("Generating procedure_adherence (~8k rows)...")
    los = fetch_rows(conn, "SELECT lo_id FROM loan_officers")
    loans = fetch_rows(conn, "SELECT loan_id FROM loan_accounts LIMIT 500")
    apps = fetch_rows(conn, "SELECT application_id FROM loan_applications LIMIT 500")
    staff_ids = [r['staff_id'] for r in fetch_rows(conn, "SELECT staff_id FROM staff WHERE role='compliance_analyst' LIMIT 8")]

    months = pd.date_range('2020-01-01', '2026-10-31', freq='MS')
    categories = ['FAIR_LENDING','BSA','TRID','HMDA','MLA','SCRA','CRA']
    procs_by_cat = {
        'FAIR_LENDING': [('FL001','Fair Lending Pre-Screen Check'), ('FL002','Pricing Consistency Review')],
        'BSA': [('BSA001','CIP Verification'), ('BSA002','Transaction Monitoring')],
        'TRID': [('TR001','Loan Estimate Timing'), ('TR002','Closing Disclosure Timing')],
        'HMDA': [('HM001','HMDA Data Entry'), ('HM002','LAR Edit Check')],
        'MLA': [('ML001','MLA Database Check'), ('ML002','MAPR Calculation')],
        'SCRA': [('SC001','SCRA Check'), ('SC002','Rate Cap Verification')],
        'CRA': [('CR001','CRA Eligibility Check')],
    }

    rows = []
    for month in months:
        mk = month.strftime('%Y-%m')
        is_covid = mk in COVID_MONTHS
        for cat in categories:
            procs = procs_by_cat.get(cat, [])
            for code, name in procs:
                # ~15 checks per category per month
                n_checks = random.randint(10, 20)
                for _ in range(n_checks):
                    fail_rate = 0.07
                    if is_covid and cat == 'TRID':
                        fail_rate = 0.15
                    if mk[:4] == '2021' and cat == 'HMDA':
                        fail_rate = 0.12
                    passed = random.random() > fail_rate
                    rows.append({
                        'adherence_id': str(uuid.uuid4()),
                        'check_date': month.date().strftime('%Y-%m-%d'),
                        'procedure_code': code,
                        'procedure_name': name,
                        'category': cat,
                        'loan_id': random.choice(loans)['loan_id'] if loans else None,
                        'application_id': random.choice(apps)['application_id'] if apps else None,
                        'lo_id': random.choice(los)['lo_id'] if los else None,
                        'passed': passed,
                        'finding_detail': fake.sentence() if not passed else None,
                        'remediated': random.random() < 0.8 if not passed else False,
                        'remediation_date': (month + pd.Timedelta(days=random.randint(5,30))).date().strftime('%Y-%m-%d') if not passed and random.random() < 0.8 else None,
                        'reviewed_by': random.choice(staff_ids) if staff_ids else None,
                    })

    # Trim to ~8000
    if len(rows) > 8000:
        rows = random.sample(rows, 8000)

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'procedure_adherence')
    mark_done('procedure_adherence')
    print(f"  inserted {len(df)} rows into procedure_adherence")


def generate_fair_lending_snapshot(conn):
    if is_done('fair_lending_snapshot'):
        print("fair_lending_snapshot already done, skipping.")
        return
    print("Generating fair_lending_snapshot...")
    products = fetch_rows(conn, "SELECT product_id FROM loan_products WHERE is_hmda_reportable=TRUE")
    months = pd.date_range('2020-01-01', '2026-10-31', freq='MS')
    demographics = ['White','Black or African American','Hispanic or Latino','Asian','Male','Female']
    base_rates = {'White':0.72,'Black or African American':0.58,'Hispanic or Latino':0.61,
                  'Asian':0.68,'Male':0.70,'Female':0.68}

    rows = []
    for month in months:
        for prod in products:
            for demo in demographics:
                total = random.randint(5, 50)
                appr_rate = base_rates.get(demo, 0.65) + random.uniform(-0.05, 0.05)
                approvals = int(total * appr_rate)
                denials = total - approvals - random.randint(0, int(total * 0.1))
                withdrawals = max(0, total - approvals - denials)
                disparity = round(appr_rate / base_rates.get('White', 0.72), 4)
                rows.append({
                    'snapshot_id': str(uuid.uuid4()),
                    'snapshot_date': month.date().strftime('%Y-%m-%d'),
                    'product_id': prod['product_id'],
                    'demographic_group': demo,
                    'race': demo if demo in ('White','Black or African American','Asian') else None,
                    'ethnicity': demo if demo == 'Hispanic or Latino' else None,
                    'sex': demo if demo in ('Male','Female') else None,
                    'age_band': None,
                    'total_applications': total,
                    'approvals': approvals,
                    'denials': denials,
                    'withdrawals': withdrawals,
                    'approval_rate': round(appr_rate, 4),
                    'avg_rate_spread': round(random.uniform(0.5, 2.5), 4),
                    'avg_dti': round(random.uniform(0.28, 0.42), 4),
                    'avg_ltv': round(random.uniform(0.70, 0.88), 4),
                    'avg_credit_score': round(random.uniform(650, 750), 2),
                    'disparity_index': disparity,
                    'risk_flag': disparity < 0.80,
                })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'fair_lending_snapshot')
    mark_done('fair_lending_snapshot')
    print(f"  inserted {len(df)} rows into fair_lending_snapshot")


def generate_mla_scra_checks(conn):
    if is_done('mla_scra_checks'):
        print("mla_scra_checks already done, skipping.")
        return
    print("Generating mla_scra_checks...")
    mla_loans = fetch_rows(conn,
        "SELECT l.loan_id, l.member_id, l.origination_date FROM loan_accounts l WHERE l.mla_covered=TRUE")
    scra_loans = fetch_rows(conn,
        "SELECT l.loan_id, l.member_id, l.origination_date FROM loan_accounts l WHERE l.scra_protected=TRUE")
    staff_ids = [r['staff_id'] for r in fetch_rows(conn, "SELECT staff_id FROM staff WHERE department='BSA' LIMIT 5")]

    rows = []
    for loan in mla_loans:
        date_str = str(loan['origination_date'])
        rows.append({
            'check_id': str(uuid.uuid4()),
            'member_id': loan['member_id'],
            'loan_id': loan['loan_id'],
            'check_date': date_str,
            'check_type': 'MLA',
            'database_queried': np.random.choice(['DMDC','DEERS','BOTH'], p=[0.50,0.20,0.30]),
            'is_covered': True,
            'coverage_start_date': date_str,
            'coverage_end_date': (pd.Timestamp(date_str) + pd.Timedelta(days=365)).date().strftime('%Y-%m-%d'),
            'mapr_rate': round(random.uniform(18.0, 36.0), 4),
            'mapr_compliant': random.random() < 0.992,
            'oral_disclosure_provided': True,
            'written_disclosure_provided': True,
            'checked_by': random.choice(staff_ids) if staff_ids else None,
        })

    for loan in scra_loans:
        date_str = str(loan['origination_date'])
        rows.append({
            'check_id': str(uuid.uuid4()),
            'member_id': loan['member_id'],
            'loan_id': loan['loan_id'],
            'check_date': date_str,
            'check_type': 'SCRA',
            'database_queried': np.random.choice(['DMDC','DEERS','BOTH'], p=[0.50,0.20,0.30]),
            'is_covered': True,
            'coverage_start_date': date_str,
            'coverage_end_date': None,
            'mapr_rate': 6.0,
            'mapr_compliant': random.random() < 0.992,
            'oral_disclosure_provided': True,
            'written_disclosure_provided': True,
            'checked_by': random.choice(staff_ids) if staff_ids else None,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'mla_scra_checks')
    mark_done('mla_scra_checks')
    print(f"  inserted {len(df)} rows into mla_scra_checks")


def generate_bsa_cases(conn):
    if is_done('bsa_cases'):
        print("bsa_cases already done, skipping.")
        return
    print("Generating bsa_cases...")
    members = fetch_rows(conn, "SELECT member_id FROM members WHERE status='ACTIVE'")
    staff_ids = [r['staff_id'] for r in fetch_rows(conn, "SELECT staff_id FROM staff WHERE department='BSA' LIMIT 5")]

    months = pd.date_range('2020-01-01', '2026-10-31', freq='MS')
    case_types = ['CTR','SAR','EDD','HIGH_RISK_REVIEW']
    case_weights = [0.60, 0.25, 0.10, 0.05]

    rows = []
    for month in months:
        mk = month.strftime('%Y-%m')
        date_str = month.date().strftime('%Y-%m-%d')
        sp = SMAP.get(date_str)
        base = 11  # ~130/year
        if sp == 'COVID_EMERGENCY':
            base = int(base * 1.3)

        for _ in range(base):
            case_type = np.random.choice(case_types, p=case_weights)
            is_sar = case_type == 'SAR'
            status = np.random.choice(['OPEN','INVESTIGATING','CLOSED','FILED','ESCALATED'],
                                      p=[0.05,0.10,0.55,0.25,0.05])
            rows.append({
                'case_id': str(uuid.uuid4()),
                'member_id': random.choice(members)['member_id'],
                'case_type': case_type,
                'case_date': date_str,
                'alert_trigger': random.choice(['Large Cash','Structuring','Unusual Pattern','Wire Transfer']),
                'risk_category': np.random.choice(['HIGH','MEDIUM','LOW'], p=[0.20,0.50,0.30]),
                'status': status,
                'assigned_to': random.choice(staff_ids) if staff_ids else None,
                'fincen_filing_required': is_sar,
                'fincen_filed': is_sar and random.random() < 0.90,
                'fincen_filing_date': (month + pd.Timedelta(days=random.randint(10, 30))).date().strftime('%Y-%m-%d') if is_sar and random.random() < 0.9 else None,
                'fincen_reference': f'SAR{random.randint(100000,999999)}' if is_sar and random.random() < 0.9 else None,
                'closed_date': (month + pd.Timedelta(days=random.randint(15, 60))).date().strftime('%Y-%m-%d') if status == 'CLOSED' else None,
                'disposition': 'SAR Filed' if is_sar else 'No Further Action',
            })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'bsa_cases')
    mark_done('bsa_cases')
    print(f"  inserted {len(df)} rows into bsa_cases")


def generate_complaints(conn):
    if is_done('complaints'):
        print("complaints already done, skipping.")
        return
    print("Generating complaints...")
    members = fetch_rows(conn, "SELECT member_id FROM members WHERE status='ACTIVE'")
    interactions = fetch_rows(conn, "SELECT interaction_id FROM member_interactions LIMIT 1000")
    loan_prods = fetch_rows(conn, "SELECT product_id FROM loan_products")
    share_prods = fetch_rows(conn, "SELECT product_id FROM share_products")
    staff_ids = [r['staff_id'] for r in fetch_rows(conn, "SELECT staff_id FROM staff WHERE department='Compliance' LIMIT 8")]

    months = pd.date_range('2020-01-01', '2026-10-31', freq='MS')
    categories = ['BILLING','SERVICING','DISCLOSURE','FAIR_LENDING','BSA','OTHER']
    cat_weights = [0.30, 0.25, 0.20, 0.15, 0.05, 0.05]
    trigger_words = [['unfair'],['discriminated','denied'],['hidden fees'],['can\'t pay'],None,None,None]
    statuses = ['RESOLVED','INVESTIGATING','OPEN','ESCALATED','REGULATORY_REFERRAL']
    status_weights = [0.65, 0.15, 0.10, 0.07, 0.03]

    rows = []
    for month in months:
        mk = month.strftime('%Y-%m')
        date_str = month.date().strftime('%Y-%m-%d')
        sp = SMAP.get(date_str)
        base = 33
        if sp in ('COVID_EMERGENCY','GOVERNMENT_SHUTDOWN'):
            base = int(base * 1.5)

        for _ in range(base):
            cat = np.random.choice(categories, p=cat_weights)
            # loan product 60%, share product 25%, neither 15%
            prod_roll = random.random()
            loan_prod_id = None
            share_prod_id = None
            if prod_roll < 0.60 and loan_prods:
                loan_prod_id = random.choice(loan_prods)['product_id']
            elif prod_roll < 0.85 and share_prods:
                share_prod_id = random.choice(share_prods)['product_id']

            tw_roll = random.random()
            if tw_roll < 0.70:
                tw = None
            elif tw_roll < 0.90:
                tw = [random.choice(['unfair','denied','discriminated','hidden'])]
            else:
                tw = random.sample(['unfair','denied','discriminated','hidden fees','can\'t pay'], 2)

            rows.append({
                'complaint_id': str(uuid.uuid4()),
                'member_id': random.choice(members)['member_id'],
                'interaction_id': random.choice(interactions)['interaction_id'] if interactions else None,
                'received_date': date_str,
                'complaint_category': cat,
                'product_id': loan_prod_id,
                'share_product_id': share_prod_id,
                'description': fake.sentence(nb_words=12),
                'trigger_words_flagged': ('{' + ','.join(f'"{w}"' for w in tw) + '}') if tw else None,
                'status': np.random.choice(statuses, p=status_weights),
                'assigned_to': random.choice(staff_ids) if staff_ids else None,
                'resolution_date': (month + pd.Timedelta(days=random.randint(5, 45))).date().strftime('%Y-%m-%d') if random.random() < 0.70 else None,
                'resolution_detail': fake.sentence() if random.random() < 0.6 else None,
                'regulatory_reported': random.random() < 0.05,
            })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'complaints')
    mark_done('complaints')
    print(f"  inserted {len(df)} rows into complaints")


def generate_trigger_word_snapshot(conn):
    if is_done('trigger_word_snapshot'):
        print("trigger_word_snapshot already done, skipping.")
        return
    print("Generating trigger_word_snapshot...")
    months = pd.date_range('2020-01-01', '2026-10-31', freq='MS')
    channels = ['BRANCH','PHONE','CHAT','EMAIL','WEB','MOBILE']
    trigger_cats = ['DISCRIMINATION','DECEPTION','COERCION','UDAP']
    words_by_cat = {
        'DISCRIMINATION': ['unfair','discriminated','biased'],
        'DECEPTION': ['hidden fees','misleading','lied'],
        'COERCION': ['forced','pressured','threatened'],
        'UDAP': ['bait','switch','deceptive'],
    }

    rows = []
    for month in months:
        date_str = month.date().strftime('%Y-%m-%d')
        sp = SMAP.get(date_str)
        multiplier = 1.5 if sp in ('COVID_EMERGENCY','GOVERNMENT_SHUTDOWN') else 1.0

        for channel in channels[:3]:  # Only top 3 to keep volume manageable
            for cat in trigger_cats:
                for word in words_by_cat[cat][:1]:
                    base_count = random.randint(5, 30)
                    rows.append({
                        'snapshot_id': str(uuid.uuid4()),
                        'snapshot_date': date_str,
                        'channel': channel,
                        'trigger_word': word,
                        'trigger_category': cat,
                        'occurrence_count': int(base_count * multiplier),
                        'complaint_count': int(base_count * multiplier * random.uniform(0.1, 0.3)),
                        'escalation_count': int(base_count * multiplier * random.uniform(0.01, 0.05)),
                        'review_status': np.random.choice(['PENDING','REVIEWED','ESCALATED','CLOSED'], p=[0.1,0.5,0.1,0.3]),
                    })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'trigger_word_snapshot')
    mark_done('trigger_word_snapshot')
    print(f"  inserted {len(df)} rows into trigger_word_snapshot")


def generate_compliance_findings(conn):
    if is_done('compliance_findings'):
        print("compliance_findings already done, skipping.")
        return
    print("Generating compliance_findings...")
    exams = fetch_rows(conn, "SELECT exam_id, exam_year, exam_type, exam_start_date FROM exam_cycles WHERE exam_type='NCUA'")
    staff_ids = [r['staff_id'] for r in fetch_rows(conn, "SELECT staff_id FROM staff WHERE department='Compliance' LIMIT 8")]

    types = ['MRA','RECOMMENDATION','BEST_PRACTICE','VIOLATION']
    type_weights = [0.15, 0.45, 0.30, 0.10]
    areas = ['FAIR_LENDING','BSA','TRID','HMDA','MLA','SCRA','CRA','CAPITAL','OTHER']
    area_weights = [0.20, 0.15, 0.20, 0.15, 0.10, 0.10, 0.05, 0.03, 0.02]
    severities = ['CRITICAL','HIGH','MEDIUM','LOW']
    sev_weights = [0.10, 0.25, 0.40, 0.25]
    statuses = ['VERIFIED_CLOSED','IN_PROGRESS','OPEN']
    stat_weights = [0.60, 0.25, 0.15]

    rows = []
    for exam in exams:
        n_findings = random.randint(20, 35)
        exam_start = str(exam['exam_start_date'] or f"{exam['exam_year']}-03-15")
        yr = exam['exam_year']

        for _ in range(n_findings):
            finding_dt = pd.Timestamp(exam_start) + pd.Timedelta(days=random.randint(0, 20))
            area = np.random.choice(areas, p=area_weights)
            # Inject more HMDA/TRID failures in 2021
            if yr == 2021 and random.random() < 0.4:
                area = random.choice(['HMDA','TRID'])
            severity = np.random.choice(severities, p=sev_weights)
            status = np.random.choice(statuses, p=stat_weights)
            finding_type = np.random.choice(types, p=type_weights)
            due_dt = finding_dt + pd.Timedelta(days=random.randint(60, 180))
            closed_dt = due_dt + pd.Timedelta(days=random.randint(-10, 30)) if status == 'VERIFIED_CLOSED' else None

            rows.append({
                'finding_id': str(uuid.uuid4()),
                'exam_id': exam['exam_id'],
                'finding_date': finding_dt.date().strftime('%Y-%m-%d'),
                'finding_type': finding_type,
                'regulatory_area': area,
                'severity': severity,
                'description': fake.sentence(nb_words=12),
                'citation': f'12 CFR {random.randint(200,1030)}.{random.randint(1,50)}',
                'corrective_action': fake.sentence(nb_words=10),
                'due_date': due_dt.date().strftime('%Y-%m-%d'),
                'status': status,
                'assigned_to': random.choice(staff_ids) if staff_ids else None,
                'closed_date': closed_dt.date().strftime('%Y-%m-%d') if closed_dt else None,
                'verified_by': random.choice(staff_ids) if staff_ids and status == 'VERIFIED_CLOSED' else None,
            })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'compliance_findings')
    mark_done('compliance_findings')
    print(f"  inserted {len(df)} rows into compliance_findings")


def generate_exam_readiness_score(conn):
    if is_done('exam_readiness_score'):
        print("exam_readiness_score already done, skipping.")
        return
    print("Generating exam_readiness_score...")
    months = pd.date_range('2020-01-01', '2026-10-31', freq='MS')
    areas = ['FAIR_LENDING','BSA','TRID','HMDA','MLA','SCRA']

    base_scores = {
        'FAIR_LENDING': 75, 'BSA': 72, 'TRID': 74, 'HMDA': 71, 'MLA': 78, 'SCRA': 76
    }

    rows = []
    prev_scores = dict(base_scores)
    for month in months:
        date_str = month.date().strftime('%Y-%m-%d')
        yr = month.year
        for area in areas:
            prev = prev_scores[area]
            # Trend upward, dip in 2023 (post-COVID doc findings)
            target = base_scores[area] + (yr - 2020) * 2.5
            if yr == 2023:
                target -= 5
            curr = round(prev + (target - prev) * 0.1 + random.uniform(-2, 2), 2)
            curr = max(60, min(95, curr))
            prev_scores[area] = curr
            trend = 'IMPROVING' if curr > prev else ('DECLINING' if curr < prev - 1 else 'STABLE')

            rows.append({
                'score_id': str(uuid.uuid4()),
                'score_date': date_str,
                'regulatory_area': area,
                'domain': area.lower().replace('_', ' '),
                'score': curr,
                'max_score': 100.0,
                'score_pct': round(curr / 100, 4),
                'prior_score': prev,
                'trend': trend,
                'gap_detail': f'Gap in {area} documentation' if curr < 80 else None,
                'action_required': curr < 70,
            })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'exam_readiness_score')
    mark_done('exam_readiness_score')
    print(f"  inserted {len(df)} rows into exam_readiness_score")


def generate_training_completions(conn):
    if is_done('training_completions'):
        print("training_completions already done, skipping.")
        return
    print("Generating training_completions (~6k rows)...")
    staff = fetch_rows(conn, "SELECT staff_id FROM staff WHERE active=TRUE")
    types = ['BSA','FAIR_LENDING','TRID','MLA','SCRA','GENERAL_COMPLIANCE','ETHICS']
    annual = ['BSA','FAIR_LENDING','TRID','MLA','SCRA','GENERAL_COMPLIANCE']

    rows = []
    for yr in range(2020, 2027):
        for s in staff:
            for tt in types:
                if tt == 'ETHICS' and yr % 2 != 0:
                    continue
                req_date = f'{yr}-12-31'
                # 90% complete before deadline, 7% late, 3% not completed
                roll = random.random()
                if roll < 0.90:
                    comp_offset = random.randint(-180, -1)
                    comp_date = (pd.Timestamp(req_date) + pd.Timedelta(days=comp_offset)).date().strftime('%Y-%m-%d')
                    passed = random.random() < 0.94
                elif roll < 0.97:
                    comp_date = (pd.Timestamp(req_date) + pd.Timedelta(days=random.randint(1, 30))).date().strftime('%Y-%m-%d')
                    passed = random.random() < 0.94
                else:
                    comp_date = None
                    passed = None

                rows.append({
                    'training_id': str(uuid.uuid4()),
                    'staff_id': s['staff_id'],
                    'course_code': f'{tt[:3]}-{yr}',
                    'course_name': f'{tt.replace("_"," ").title()} Training {yr}',
                    'training_type': tt,
                    'required': True,
                    'required_completion_date': req_date,
                    'completion_date': comp_date,
                    'score': round(random.uniform(70, 100), 2) if comp_date else None,
                    'passed': passed,
                    'certification_expiry': f'{yr+1}-12-31' if comp_date else None,
                })

    if len(rows) > 7000:
        rows = random.sample(rows, 7000)

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'training_completions')
    mark_done('training_completions')
    print(f"  inserted {len(df)} rows into training_completions")


def generate_file_exceptions(conn):
    if is_done('file_exceptions'):
        print("file_exceptions already done, skipping.")
        return
    print("Generating file_exceptions...")
    loans = fetch_rows(conn, "SELECT loan_id FROM loan_accounts LIMIT 300")
    apps = fetch_rows(conn, "SELECT application_id FROM loan_applications LIMIT 300")
    los = fetch_rows(conn, "SELECT lo_id FROM loan_officers")
    staff_ids = [r['staff_id'] for r in fetch_rows(conn, "SELECT staff_id FROM staff WHERE department='Compliance' LIMIT 8")]

    exc_types = ['MISSING_DOCUMENT','EXPIRED_DOCUMENT','DATA_DISCREPANCY','POLICY_DEVIATION']
    exc_weights = [0.50, 0.20, 0.20, 0.10]
    sev_opts = ['HIGH','MEDIUM','LOW']
    sev_weights = [0.20, 0.50, 0.30]

    months = pd.date_range('2020-01-01', '2026-10-31', freq='MS')
    rows = []
    for month in months:
        date_str = month.date().strftime('%Y-%m-%d')
        sp = SMAP.get(date_str)
        base = 42  # ~3500/82
        if sp == 'COVID_EMERGENCY':
            base = int(base * 1.5)

        for _ in range(base):
            ident_dt = month + pd.Timedelta(days=random.randint(0, 28))
            days_out = random.randint(1, 90)
            resolved = random.random() < 0.75
            rows.append({
                'exception_id': str(uuid.uuid4()),
                'loan_id': random.choice(loans)['loan_id'] if loans else None,
                'application_id': random.choice(apps)['application_id'] if apps else None,
                'exception_type': np.random.choice(exc_types, p=exc_weights),
                'description': fake.sentence(nb_words=8),
                'identified_date': ident_dt.date().strftime('%Y-%m-%d'),
                'identified_by': random.choice(staff_ids) if staff_ids else None,
                'days_outstanding': days_out,
                'resolution_due_date': (ident_dt + pd.Timedelta(days=30)).date().strftime('%Y-%m-%d'),
                'resolved': resolved,
                'resolution_date': (ident_dt + pd.Timedelta(days=random.randint(5, days_out))).date().strftime('%Y-%m-%d') if resolved else None,
                'resolved_by': random.choice(staff_ids) if staff_ids and resolved else None,
                'exception_severity': np.random.choice(sev_opts, p=sev_weights),
                'lo_id': random.choice(los)['lo_id'] if los else None,
            })

    if len(rows) > 3500:
        rows = random.sample(rows, 3500)

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'file_exceptions')
    mark_done('file_exceptions')
    print(f"  inserted {len(df)} rows into file_exceptions")


def generate_action_artifacts(conn):
    if is_done('action_artifacts'):
        print("action_artifacts already done, skipping.")
        return
    print("Generating action_artifacts...")
    findings = fetch_rows(conn, "SELECT finding_id FROM compliance_findings LIMIT 200")
    complaints_rows = fetch_rows(conn, "SELECT complaint_id FROM complaints LIMIT 200")
    staff_ids = [r['staff_id'] for r in fetch_rows(conn, "SELECT staff_id FROM staff WHERE department='Compliance' LIMIT 8")]

    action_types = ['POLICY_UPDATE','TRAINING','PROCESS_CHANGE','SYSTEM_CHANGE','COMMUNICATION','ESCALATION']
    act_weights = [0.25, 0.30, 0.25, 0.10, 0.08, 0.02]
    statuses = ['COMPLETED','IN_PROGRESS','OPEN','OVERDUE']
    stat_weights = [0.60, 0.25, 0.10, 0.05]

    rows = []
    sources = (
        [('EXAM_FINDING', f['finding_id']) for f in findings[:200]] +
        [('COMPLAINT', c['complaint_id']) for c in complaints_rows[:200]]
    )
    sample = random.sample(sources, min(400, len(sources)))

    for src_type, src_id in sample:
        due_dt = fake.date_between(start_date='-2y', end_date='+1y')
        status = np.random.choice(statuses, p=stat_weights)
        rows.append({
            'artifact_id': str(uuid.uuid4()),
            'source_type': src_type,
            'source_id': src_id,
            'action_type': np.random.choice(action_types, p=act_weights),
            'title': fake.sentence(nb_words=5),
            'description': fake.sentence(nb_words=12),
            'assigned_to': random.choice(staff_ids) if staff_ids else None,
            'due_date': due_dt.strftime('%Y-%m-%d'),
            'status': status,
            'completed_date': (due_dt + pd.Timedelta(days=random.randint(-10, 10))).strftime('%Y-%m-%d') if status == 'COMPLETED' else None,
            'evidence_url': None,
            'board_reported': random.random() < 0.15,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'action_artifacts')
    mark_done('action_artifacts')
    print(f"  inserted {len(df)} rows into action_artifacts")


def generate_regulatory_items(conn):
    if is_done('regulatory_items'):
        print("regulatory_items already done, skipping.")
        return
    print("Generating regulatory_items...")
    staff_ids = [r['staff_id'] for r in fetch_rows(conn, "SELECT staff_id FROM staff WHERE department='Compliance' LIMIT 8")]

    items = []
    # Annual HMDA filings
    for yr in range(2020, 2027):
        items.append(('NCUA', 'DEADLINE', f'HMDA LAR Submission {yr}', f'{yr}-01-01', f'{yr+1}-03-01',
                       'Annual HMDA LAR data submission', ['HMDA','FAIR_LENDING'], 'COMPLETED' if yr < 2026 else 'IN_PROGRESS'))
    # BSA exam prep
    for yr in range(2020, 2027):
        items.append(('FINCEN', 'DEADLINE', f'BSA Annual Exam Preparation {yr}', f'{yr}-01-01', f'{yr}-06-30',
                       'Annual BSA/AML exam preparation package', ['BSA'], 'COMPLETED' if yr < 2026 else 'IN_PROGRESS'))
    # Key rule updates
    items.extend([
        ('NCUA', 'RULE', 'NCUA MLA Interpretive Rule Update', '2020-06-01', '2021-01-01', 'Updated MLA interpretive guidance', ['MLA'], 'COMPLETED'),
        ('CFPB', 'GUIDANCE', 'CFPB TRID Amendment Guidance', '2020-09-01', '2021-03-01', 'Revised TRID timing requirements', ['TRID'], 'COMPLETED'),
        ('NCUA', 'RULE', 'NCUA CECL Implementation', '2021-01-01', '2023-01-01', 'CECL adoption for credit unions', ['CAPITAL'], 'COMPLETED'),
        ('CFPB', 'GUIDANCE', 'CFPB Fair Lending Supervisory Update', '2021-07-01', '2022-01-01', 'Updated fair lending examination procedures', ['FAIR_LENDING'], 'COMPLETED'),
        ('FINCEN', 'RULE', 'FinCEN Beneficial Ownership Rule', '2022-01-01', '2024-01-01', 'Enhanced CDD rule implementation', ['BSA'], 'COMPLETED'),
        ('NCUA', 'POLICY_UPDATE', 'NCUA Interest Rate Risk Guidance', '2022-06-01', '2023-01-01', 'Enhanced IRR monitoring requirements', ['CAPITAL'], 'COMPLETED'),
        ('CFPB', 'RULE', 'CFPB Section 1071 Small Business Data', '2023-03-30', '2024-10-01', 'Small business lending data collection rule', ['FAIR_LENDING','HMDA'], 'IN_PROGRESS'),
        ('NCUA', 'GUIDANCE', 'NCUA Digital Assets Guidance', '2023-01-01', '2023-12-31', 'Digital asset custody and investment guidance', ['OTHER'], 'COMPLETED'),
        ('CFPB', 'RULE', 'CFPB Open Banking Rule', '2024-01-01', '2026-04-01', 'Personal financial data rights rule', ['OTHER'], 'PENDING'),
        ('NCUA', 'DEADLINE', 'NCUA Exam 2026 Submission', '2026-01-01', '2026-04-15', '2026 examination documentation', ['FAIR_LENDING','BSA','TRID'], 'IN_PROGRESS'),
    ])

    rows = []
    for item in items:
        body, itype, title, eff_date, due_date, desc, areas, status = item
        rows.append({
            'item_id': str(uuid.uuid4()),
            'item_type': itype,
            'regulatory_body': body,
            'title': title,
            'effective_date': eff_date,
            'due_date': due_date,
            'description': desc,
            'impact_areas': '{' + ','.join(areas) + '}',
            'status': status,
            'assigned_to': random.choice(staff_ids) if staff_ids else None,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'regulatory_items')
    mark_done('regulatory_items')
    print(f"  inserted {len(df)} rows into regulatory_items")


def run():
    conn = get_conn()
    generate_cip_documentation(conn)
    generate_esign_consent(conn)
    generate_disclosures(conn)
    generate_changed_circumstances(conn)
    generate_hmda_lar_records(conn)
    generate_procedure_adherence(conn)
    generate_fair_lending_snapshot(conn)
    generate_mla_scra_checks(conn)
    generate_bsa_cases(conn)
    generate_complaints(conn)
    generate_trigger_word_snapshot(conn)
    generate_compliance_findings(conn)
    generate_exam_readiness_score(conn)
    generate_training_completions(conn)
    generate_file_exceptions(conn)
    generate_action_artifacts(conn)
    generate_regulatory_items(conn)
    conn.close()
    print("Wave 4b compliance complete.")


if __name__ == '__main__':
    run()
