"""wave4d: member engagement tables — member_interactions, digital_engagement,
member_share_of_wallet, nps_snapshot, membership_snapshot, seg_deposit_snapshot"""
import uuid
import random
import pandas as pd
import numpy as np
from utils import get_conn, copy_df_to_table, fetch_rows, is_done, mark_done
from config import SCENARIO_PERIODS

random.seed(400)
np.random.seed(400)

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


def generate_member_interactions(conn):
    if is_done('member_interactions'):
        print("member_interactions already done, skipping.")
        return
    print("Generating member_interactions (~180k rows, chunked)...")

    members = fetch_rows(conn, "SELECT member_id FROM members WHERE status='ACTIVE'")
    staff = fetch_rows(conn, "SELECT staff_id FROM staff WHERE department IN ('Operations','Compliance') LIMIT 30")
    staff_ids = [s['staff_id'] for s in staff]

    months = pd.date_range('2020-01-01', '2026-10-01', freq='MS')
    int_types = ['INQUIRY','TRANSACTION','COMPLAINT','ESCALATION']
    int_weights = [0.50, 0.30, 0.10, 0.10]

    total_inserted = 0
    batch_size = 10000

    for month in months:
        date_str = month.date().strftime('%Y-%m-%d')
        mk = month.strftime('%Y-%m')
        is_covid = mk in COVID_MONTHS
        is_shutdown = mk in SHUTDOWN_MONTHS

        n_interactions = 2500
        if is_covid:
            channels = ['BRANCH','PHONE','CHAT','EMAIL','WEB','MOBILE']
            ch_weights = [0.02, 0.30, 0.20, 0.15, 0.10, 0.23]
        elif month.year >= 2023:
            channels = ['BRANCH','PHONE','CHAT','EMAIL','WEB','MOBILE']
            ch_weights = [0.15, 0.25, 0.20, 0.10, 0.10, 0.20]
        else:
            channels = ['BRANCH','PHONE','CHAT','EMAIL','WEB','MOBILE']
            ch_weights = [0.25, 0.35, 0.15, 0.15, 0.05, 0.05]

        mean_sat = 3.6 if (is_covid or is_shutdown) else 4.1
        mean_nps = 28 if (is_covid or is_shutdown) else 42

        rows = []
        for _ in range(n_interactions):
            member = random.choice(members)
            channel = np.random.choice(channels, p=ch_weights)
            int_type = np.random.choice(int_types, p=int_weights)
            dur_map = {'BRANCH': (300, 1800), 'PHONE': (180, 900), 'CHAT': (120, 600),
                       'EMAIL': (60, 300), 'WEB': (30, 180), 'MOBILE': (20, 120)}
            dur_range = dur_map.get(channel, (60, 300))
            duration = random.randint(*dur_range)

            sat_score = int(np.clip(np.round(np.random.normal(mean_sat, 0.8)), 1, 5))
            nps = int(np.clip(np.round(np.random.normal(mean_nps, 25)), -100, 100))

            # Random time within month
            day = random.randint(1, 28)
            hour = random.randint(8, 17)
            int_dt = f'{month.year}-{month.month:02d}-{day:02d} {hour:02d}:{random.randint(0,59):02d}:00'

            resolved = int_type not in ('COMPLAINT','ESCALATION') or random.random() < 0.80
            rows.append({
                'interaction_id': str(uuid.uuid4()),
                'member_id': member['member_id'],
                'interaction_date': int_dt,
                'channel': channel,
                'interaction_type': int_type,
                'department': random.choice(['Operations','Lending','Member Services']),
                'staff_id': random.choice(staff_ids) if staff_ids else None,
                'duration_seconds': duration,
                'resolved': resolved,
                'resolution_date': (month + pd.Timedelta(days=random.randint(1, 7))).strftime('%Y-%m-%d %H:%M:%S') if resolved and int_type in ('COMPLAINT','ESCALATION') else None,
                'satisfaction_score': sat_score,
                'nps_response': nps,
            })

        if rows:
            df = pd.DataFrame(rows)
            copy_df_to_table(conn, df, 'member_interactions')
            total_inserted += len(rows)

    mark_done('member_interactions')
    print(f"  member_interactions done: {total_inserted} total rows")


def generate_digital_engagement(conn):
    if is_done('digital_engagement'):
        print("digital_engagement already done, skipping.")
        return
    print("Generating digital_engagement (chunked, ~400k rows)...")

    digital_members = fetch_rows(conn, "SELECT member_id FROM members WHERE digital_enrolled=TRUE AND status='ACTIVE'")
    months = pd.date_range('2020-01-01', '2026-10-01', freq='MS')
    channels = ['MOBILE_APP','ONLINE_BANKING','CHATBOT','ALEXA','OTHER']
    ch_weights = [0.60, 0.30, 0.08, 0.02, 0.0]

    total_inserted = 0
    batch_size = 500

    for chunk_start in range(0, len(digital_members), batch_size):
        chunk = digital_members[chunk_start:chunk_start + batch_size]
        rows = []

        for member in chunk:
            for month in months:
                date_str = month.date().strftime('%Y-%m-%d')
                mk = month.strftime('%Y-%m')
                is_covid = mk in COVID_MONTHS
                is_shutdown = mk in SHUTDOWN_MONTHS

                # ~65% of digital members have engagement per month
                if random.random() > 0.65:
                    continue

                channel = np.random.choice(channels, p=ch_weights)
                sessions = random.randint(8, 25) if is_covid else random.randint(3, 15)
                transactions = random.randint(2, 10)
                products_viewed = random.randint(1, 5)
                support_reqs = random.randint(0, 2)
                avg_session_min = round(random.uniform(5, 25), 2)

                rows.append({
                    'engagement_id': str(uuid.uuid4()),
                    'engagement_date': date_str,
                    'member_id': member['member_id'],
                    'channel': channel,
                    'sessions_count': sessions,
                    'transactions_count': transactions,
                    'products_viewed': products_viewed,
                    'support_requests': support_reqs,
                    'avg_session_minutes': avg_session_min,
                    'feature_flags': None,
                    'government_shutdown_period': is_shutdown,
                })

        if rows:
            df = pd.DataFrame(rows)
            copy_df_to_table(conn, df, 'digital_engagement')
            total_inserted += len(rows)
            if chunk_start % 5000 == 0:
                print(f"  ...{total_inserted} digital_engagement rows so far")

    mark_done('digital_engagement')
    print(f"  digital_engagement done: {total_inserted} total rows")


def generate_member_share_of_wallet(conn):
    if is_done('member_share_of_wallet'):
        print("member_share_of_wallet already done, skipping.")
        return
    print("Generating member_share_of_wallet (~12k rows)...")

    members = fetch_rows(conn, "SELECT member_id FROM members WHERE status='ACTIVE'")
    snapshot_date = '2026-10-31'

    # Aggregate balances from share_accounts
    share_data = fetch_rows(conn,
        "SELECT member_id, "
        "SUM(CASE WHEN p.product_category='CHECKING' THEN sa.current_balance ELSE 0 END) as checking_bal, "
        "SUM(CASE WHEN p.product_category='SAVINGS' THEN sa.current_balance ELSE 0 END) as savings_bal, "
        "SUM(CASE WHEN p.product_category='CERTIFICATE' THEN sa.current_balance ELSE 0 END) as cert_bal, "
        "COUNT(DISTINCT sa.product_id) as share_prod_count "
        "FROM share_accounts sa JOIN share_products p ON sa.product_id=p.product_id "
        "WHERE sa.account_status='ACTIVE' "
        "GROUP BY member_id")
    share_map = {r['member_id']: r for r in share_data}

    loan_data = fetch_rows(conn,
        "SELECT member_id, SUM(current_balance) as loan_bal, COUNT(*) as loan_count "
        "FROM loan_accounts WHERE loan_status NOT IN ('PAID_OFF','CHARGED_OFF') "
        "GROUP BY member_id")
    loan_map = {r['member_id']: r for r in loan_data}

    rows = []
    for member in members:
        mid = member['member_id']
        sd = share_map.get(mid, {})
        ld = loan_map.get(mid, {})

        checking = float(sd.get('checking_bal') or 0)
        savings = float(sd.get('savings_bal') or 0)
        certs = float(sd.get('cert_bal') or 0)
        loan_bal = float(ld.get('loan_bal') or 0)
        prod_count = int(sd.get('share_prod_count') or 0) + int(ld.get('loan_count') or 0)

        total_cu = checking + savings + certs + loan_bal
        outside = round((checking + savings) * random.uniform(1.5, 3.5), 2)
        sow_pct = round(total_cu / (total_cu + outside + 0.01), 4)
        nps = int(np.clip(np.round(np.random.normal(42 + prod_count * 3, 15)), -100, 100))

        rows.append({
            'wallet_id': str(uuid.uuid4()),
            'member_id': mid,
            'snapshot_date': snapshot_date,
            'checking_balance': checking,
            'savings_balance': savings,
            'loan_balance': loan_bal,
            'certificates_balance': certs,
            'investment_balance': 0.0,
            'estimated_outside_deposits': outside,
            'share_of_wallet_pct': sow_pct,
            'product_count': prod_count,
            'nps_score': nps,
        })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'member_share_of_wallet')
    mark_done('member_share_of_wallet')
    print(f"  inserted {len(df)} rows into member_share_of_wallet")


def generate_nps_snapshot(conn):
    if is_done('nps_snapshot'):
        print("nps_snapshot already done, skipping.")
        return
    print("Generating nps_snapshot...")
    months = pd.date_range('2020-01-01', '2026-10-01', freq='MS')
    segs = fetch_rows(conn, "SELECT seg_id, seg_type FROM seg_groups")
    seg_id_map = {s['seg_id']: s['seg_type'] for s in segs}
    seg_ids = [s['seg_id'] for s in segs[:5]]

    rows = []
    prev_scores = {}

    for month in months:
        date_str = month.date().strftime('%Y-%m-%d')
        mk = month.strftime('%Y-%m')
        is_covid = mk in COVID_MONTHS
        is_shutdown = mk in SHUTDOWN_MONTHS

        base_nps = 42
        if is_covid:
            base_nps = 28
        elif is_shutdown:
            base_nps = 32

        # Overall by channel
        for channel in ['ALL','BRANCH','PHONE','CHAT']:
            ch_nps = base_nps + random.uniform(-8, 8)
            prev = prev_scores.get(('ALL', channel), ch_nps)
            trend = 'IMPROVING' if ch_nps > prev + 1 else ('DECLINING' if ch_nps < prev - 1 else 'STABLE')
            prev_scores[('ALL', channel)] = ch_nps

            total = random.randint(50, 300)
            promoters = int(total * random.uniform(0.45, 0.65))
            detractors = int(total * random.uniform(0.10, 0.25))
            passives = total - promoters - detractors

            rows.append({
                'snapshot_id': str(uuid.uuid4()),
                'snapshot_date': date_str,
                'period_type': 'MONTHLY',
                'segment': 'ALL',
                'seg_id': None,
                'branch_id': None,
                'channel': channel,
                'nps_score': round(ch_nps, 2),
                'promoters_count': promoters,
                'passives_count': passives,
                'detractors_count': detractors,
                'total_responses': total,
                'avg_satisfaction_score': round(random.uniform(3.5 if (is_covid or is_shutdown) else 4.0, 4.5), 2),
                'response_rate_pct': round(random.uniform(0.08, 0.20), 4),
                'prior_period_nps': round(prev, 2),
                'nps_trend': trend,
            })

        # By segment (ALL channel)
        for seg_id in seg_ids:
            seg_type = seg_id_map.get(seg_id, 'ALL')
            seg_key = f'SEG_{seg_type}' if seg_type in ('SENATE','HOUSE','CONTRACTOR','RETIREE') else 'ALL'
            seg_nps = base_nps + random.uniform(-10, 10)
            prev = prev_scores.get((seg_id, 'ALL'), seg_nps)
            trend = 'IMPROVING' if seg_nps > prev + 1 else ('DECLINING' if seg_nps < prev - 1 else 'STABLE')
            prev_scores[(seg_id, 'ALL')] = seg_nps

            total = random.randint(20, 100)
            promoters = int(total * random.uniform(0.40, 0.65))
            detractors = int(total * random.uniform(0.10, 0.25))
            passives = total - promoters - detractors

            if seg_key not in ('SEG_SENATE','SEG_HOUSE','SEG_CONTRACTOR','SEG_RETIREE','BRANCH','ALL'):
                seg_key = 'ALL'

            rows.append({
                'snapshot_id': str(uuid.uuid4()),
                'snapshot_date': date_str,
                'period_type': 'MONTHLY',
                'segment': seg_key,
                'seg_id': seg_id,
                'branch_id': None,
                'channel': 'ALL',
                'nps_score': round(seg_nps, 2),
                'promoters_count': promoters,
                'passives_count': passives,
                'detractors_count': detractors,
                'total_responses': total,
                'avg_satisfaction_score': round(random.uniform(3.5 if (is_covid or is_shutdown) else 4.0, 4.5), 2),
                'response_rate_pct': round(random.uniform(0.08, 0.20), 4),
                'prior_period_nps': round(prev, 2),
                'nps_trend': trend,
            })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'nps_snapshot')
    mark_done('nps_snapshot')
    print(f"  inserted {len(df)} rows into nps_snapshot")


def generate_membership_snapshot(conn):
    if is_done('membership_snapshot'):
        print("membership_snapshot already done, skipping.")
        return
    print("Generating membership_snapshot...")
    months = pd.date_range('2020-01-01', '2026-10-01', freq='MS')
    segs = fetch_rows(conn, "SELECT seg_id FROM seg_groups LIMIT 5")

    rows = []
    running_total = {s['seg_id']: random.randint(500, 2500) for s in segs}

    for month in months:
        date_str = month.date().strftime('%Y-%m-%d')
        mk = month.strftime('%Y-%m')

        for seg in segs:
            seg_id = seg['seg_id']
            new_members = random.randint(2, 15)
            closed_members = random.randint(0, 5)
            running_total[seg_id] = running_total[seg_id] + new_members - closed_members
            total = running_total[seg_id]
            digital_rate = round(min(0.72, 0.40 + (month.year - 2020) * 0.03 + random.uniform(-0.02, 0.02)), 4)

            rows.append({
                'snapshot_id': str(uuid.uuid4()),
                'snapshot_date': date_str,
                'seg_id': seg_id,
                'total_members': total,
                'new_members': new_members,
                'closed_members': closed_members,
                'active_borrowers': int(total * random.uniform(0.45, 0.65)),
                'avg_tenure_months': round(random.uniform(48, 120), 2),
                'digital_adoption_rate': digital_rate,
            })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'membership_snapshot')
    mark_done('membership_snapshot')
    print(f"  inserted {len(df)} rows into membership_snapshot")


def generate_seg_deposit_snapshot(conn):
    if is_done('seg_deposit_snapshot'):
        print("seg_deposit_snapshot already done, skipping.")
        return
    print("Generating seg_deposit_snapshot...")
    months = pd.date_range('2020-01-01', '2026-10-01', freq='MS')
    segs = fetch_rows(conn, "SELECT seg_id FROM seg_groups LIMIT 5")

    rows = []
    prev_balances = {}

    for month in months:
        date_str = month.date().strftime('%Y-%m-%d')
        mk = month.strftime('%Y-%m')
        is_shutdown = mk in SHUTDOWN_MONTHS

        for seg in segs:
            seg_id = seg['seg_id']
            base_bal = prev_balances.get(seg_id, random.uniform(5000000, 25000000))
            # Deposits grow slightly each month
            new_bal = round(base_bal * random.uniform(0.995, 1.015), 2)
            if is_shutdown:
                new_bal = round(new_bal * 0.96, 2)  # withdrawals during shutdown

            prev_non_shutdown = prev_balances.get(f'{seg_id}_prev_normal', new_bal)
            prior_comparison = round(new_bal - prev_non_shutdown, 2) if is_shutdown else None

            prev_balances[seg_id] = new_bal
            if not is_shutdown:
                prev_balances[f'{seg_id}_prev_normal'] = new_bal

            rows.append({
                'snapshot_id': str(uuid.uuid4()),
                'snapshot_date': date_str,
                'seg_id': seg_id,
                'total_members_with_deposits': random.randint(300, 2000),
                'total_deposit_balance': new_bal,
                'avg_balance_per_member': round(new_bal / random.randint(300, 2000), 2),
                'checking_balance': round(new_bal * 0.35, 2),
                'savings_balance': round(new_bal * 0.30, 2),
                'certificate_balance': round(new_bal * 0.25, 2),
                'money_market_balance': round(new_bal * 0.10, 2),
                'government_shutdown_flag': is_shutdown,
                'prior_shutdown_comparison': prior_comparison,
            })

    df = pd.DataFrame(rows)
    copy_df_to_table(conn, df, 'seg_deposit_snapshot')
    mark_done('seg_deposit_snapshot')
    print(f"  inserted {len(df)} rows into seg_deposit_snapshot")


def run():
    conn = get_conn()
    generate_member_interactions(conn)
    generate_digital_engagement(conn)
    generate_member_share_of_wallet(conn)
    generate_nps_snapshot(conn)
    generate_membership_snapshot(conn)
    generate_seg_deposit_snapshot(conn)
    conn.close()
    print("Wave 4d member engagement complete.")


if __name__ == '__main__':
    run()
