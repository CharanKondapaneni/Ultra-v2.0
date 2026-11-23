import uuid
import random
import pandas as pd
from faker import Faker
from utils import get_conn, copy_df_to_table, fetch_rows, is_done, mark_done
from config import BRANCHES, SEG_DISTRIBUTION, TOTAL_MEMBERS

fake = Faker()
Faker.seed(42)
random.seed(42)


def generate_employers(conn):
    if is_done('employers'):
        print("employers already done, skipping.")
        return
    print("Generating employers...")

    employers = [
        ('US Senate', 'SEG', 'GOV', 'SENATE', 'HIGH', 'CRITICAL'),
        ('US House of Representatives', 'SEG', 'GOV', 'HOUSE', 'HIGH', 'CRITICAL'),
        ('Senate Sergeant at Arms', 'SEG', 'GOV', 'SSAA', 'HIGH', 'HIGH'),
        ('House Sergeant at Arms', 'SEG', 'GOV', 'HSAA', 'HIGH', 'HIGH'),
        ('Congressional Budget Office', 'SEG', 'GOV', 'CBO', 'MEDIUM', 'MEDIUM'),
        ('Library of Congress', 'SEG', 'GOV', 'LOC', 'MEDIUM', 'MEDIUM'),
        ('Government Accountability Office', 'SEG', 'GOV', 'GAO', 'MEDIUM', 'MEDIUM'),
        ('Capitol Police', 'SEG', 'GOV', 'USCP', 'HIGH', 'HIGH'),
        ('Architect of the Capitol', 'SEG', 'GOV', 'AOC', 'MEDIUM', 'MEDIUM'),
        ('Congressional Research Service', 'SEG', 'GOV', 'CRS', 'MEDIUM', 'MEDIUM'),
        ('Booz Allen Hamilton', 'DIRECT', 'CONSULTING', None, 'LOW', 'LOW'),
        ('Leidos', 'DIRECT', 'DEFENSE', None, 'LOW', 'LOW'),
        ('SAIC', 'DIRECT', 'DEFENSE', None, 'LOW', 'LOW'),
        ('Federal Retirement Thrift Investment Board', 'SPONSOR', 'GOV', 'FRTIB', 'LOW', 'LOW'),
        ('Department of Defense', 'SEG', 'GOV', 'DOD', 'MEDIUM', 'MEDIUM'),
    ]

    rows = []
    for e in employers:
        rows.append({
            'employer_id': str(uuid.uuid4()),
            'name': e[0],
            'employer_type': e[1],
            'industry_code': e[2],
            'federal_agency_code': e[3],
            'shutdown_sensitivity': e[4],
            'shutdown_risk_level': e[5],
            'last_financial_review_date': '2026-01-01',
            'active': True,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'employers')
    mark_done('employers')
    print(f"  inserted {len(df)} rows into employers")


def generate_seg_groups(conn):
    if is_done('seg_groups'):
        print("seg_groups already done, skipping.")
        return
    print("Generating seg_groups...")

    employer_rows = fetch_rows(conn, "SELECT employer_id, name FROM employers")
    emp_map = {r['name']: r['employer_id'] for r in employer_rows}

    segs = [
        ('Senate Staff SEG', 'SENATE', 'US Senate', 0.25),
        ('House Staff SEG', 'HOUSE', 'US House of Representatives', 0.33),
        ('Capitol Contractors SEG', 'CONTRACTOR', 'Booz Allen Hamilton', 0.21),
        ('Congressional Retirees SEG', 'RETIREE', 'Federal Retirement Thrift Investment Board', 0.13),
        ('Military Personnel SEG', 'MILITARY', 'Department of Defense', 0.08),
        ('GAO Staff SEG', 'SENATE', 'Government Accountability Office', 0.0),
        ('CBO Staff SEG', 'HOUSE', 'Congressional Budget Office', 0.0),
        ('Capitol Police SEG', 'MILITARY', 'Capitol Police', 0.0),
    ]

    rows = []
    for s in segs:
        emp_id = emp_map.get(s[2])
        count = int(SEG_DISTRIBUTION.get(s[1], 0) * TOTAL_MEMBERS) if s[3] > 0 else 100
        rows.append({
            'seg_id': str(uuid.uuid4()),
            'employer_id': emp_id,
            'seg_name': s[0],
            'seg_type': s[1],
            'estimated_eligible_count': count,
            'effective_date': '2015-01-01',
            'end_date': None,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'seg_groups')
    mark_done('seg_groups')
    print(f"  inserted {len(df)} rows into seg_groups")


def generate_branches(conn):
    if is_done('branches'):
        print("branches already done, skipping.")
        return
    print("Generating branches...")

    rows = []
    for b in BRANCHES:
        rows.append({
            'branch_id': str(uuid.uuid4()),
            'branch_code': b['code'],
            'name': b['name'],
            'address': fake.street_address(),
            'city': b['city'],
            'state': b['state'],
            'zip': b['zip'],
            'region': b['region'],
            'manager_staff_id': None,
            'active': True,
            'opened_date': '2010-01-01',
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'branches')
    mark_done('branches')
    print(f"  inserted {len(df)} rows into branches")


def generate_staff(conn):
    if is_done('staff'):
        print("staff already done, skipping.")
        return
    print("Generating staff...")

    branch_ids = [r['branch_id'] for r in fetch_rows(conn, "SELECT branch_id FROM branches")]

    roles_counts = [
        ('ceo', 1), ('cfo', 1), ('vp_compliance', 1), ('vp_lending', 1), ('vp_operations', 1),
        ('branch_manager', 4), ('compliance_officer', 4), ('compliance_analyst', 8),
        ('bsa_officer', 4), ('loan_officer_manager', 2), ('loan_processor', 10),
        ('member_services', 20), ('finance_analyst', 6), ('auditor', 3),
        ('it_staff', 4), ('hr_staff', 4), ('teller', 6),
    ]

    dept_map = {
        'ceo': 'Executive', 'cfo': 'Finance', 'vp_compliance': 'Compliance',
        'vp_lending': 'Lending', 'vp_operations': 'Operations',
        'branch_manager': 'Operations', 'compliance_officer': 'Compliance',
        'compliance_analyst': 'Compliance', 'bsa_officer': 'BSA',
        'loan_officer_manager': 'Lending', 'loan_processor': 'Lending',
        'member_services': 'Operations', 'finance_analyst': 'Finance',
        'auditor': 'Internal Audit', 'it_staff': 'Technology',
        'hr_staff': 'Human Resources', 'teller': 'Operations',
    }

    all_staff = []
    emp_num = 1000
    for role, count in roles_counts:
        for _ in range(count):
            sid = str(uuid.uuid4())
            all_staff.append({
                'staff_id': sid,
                'employee_id': f'EMP{emp_num:04d}',
                'first_name': fake.first_name(),
                'last_name': fake.last_name(),
                'role': role,
                'department': dept_map.get(role, 'Operations'),
                'branch_id': random.choice(branch_ids) if role not in ('ceo','cfo','vp_compliance','vp_lending','vp_operations') else branch_ids[0],
                'hire_date': fake.date_between(start_date='-14y', end_date='-1y').strftime('%Y-%m-%d'),
                'termination_date': None,
                'manager_staff_id': None,
                'active': True,
            })
            emp_num += 1

    # Set manager hierarchy
    ceo = next(s for s in all_staff if s['role'] == 'ceo')
    cfo = next(s for s in all_staff if s['role'] == 'cfo')
    vp_comp = next(s for s in all_staff if s['role'] == 'vp_compliance')
    vp_lend = next(s for s in all_staff if s['role'] == 'vp_lending')
    vp_ops = next(s for s in all_staff if s['role'] == 'vp_operations')

    for s in all_staff:
        if s['role'] in ('cfo','vp_compliance','vp_lending','vp_operations'):
            s['manager_staff_id'] = ceo['staff_id']
        elif s['role'] in ('compliance_officer','compliance_analyst','bsa_officer'):
            s['manager_staff_id'] = vp_comp['staff_id']
        elif s['role'] in ('loan_officer_manager','loan_processor'):
            s['manager_staff_id'] = vp_lend['staff_id']
        elif s['role'] in ('branch_manager','member_services','teller'):
            s['manager_staff_id'] = vp_ops['staff_id']
        elif s['role'] in ('finance_analyst',):
            s['manager_staff_id'] = cfo['staff_id']

    df = pd.DataFrame(all_staff)
    copy_df_to_table(conn, df, 'staff')
    mark_done('staff')
    print(f"  inserted {len(df)} rows into staff")

    # Update branch managers
    branch_managers = [s for s in all_staff if s['role'] == 'branch_manager']
    cur = conn.cursor()
    for i, branch_id in enumerate(branch_ids):
        if i < len(branch_managers):
            cur.execute("UPDATE branches SET manager_staff_id=%s WHERE branch_id=%s",
                        (branch_managers[i]['staff_id'], branch_id))
    conn.commit()
    cur.close()


def generate_loan_officers(conn):
    if is_done('loan_officers'):
        print("loan_officers already done, skipping.")
        return
    print("Generating loan_officers...")

    lo_staff = fetch_rows(conn,
        "SELECT staff_id, branch_id, hire_date FROM staff WHERE role IN ('loan_processor','loan_officer_manager') LIMIT 15")
    branch_ids = [r['branch_id'] for r in fetch_rows(conn, "SELECT branch_id FROM branches")]

    rows = []
    for s in lo_staff:
        rows.append({
            'lo_id': str(uuid.uuid4()),
            'staff_id': s['staff_id'],
            'nmls_id': f'NMLS{random.randint(1000000, 9999999)}',
            'branch_id': s['branch_id'] or random.choice(branch_ids),
            'active': True,
            'hire_date': str(s['hire_date']),
            'termination_date': None,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'loan_officers')
    mark_done('loan_officers')
    print(f"  inserted {len(df)} rows into loan_officers")


def run():
    conn = get_conn()
    generate_employers(conn)
    generate_seg_groups(conn)
    generate_branches(conn)
    generate_staff(conn)
    generate_loan_officers(conn)
    conn.close()
    print("Wave 2 org complete.")


if __name__ == '__main__':
    run()
