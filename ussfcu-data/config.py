DB_DSN = "postgresql://user:password@localhost:5432/ussfcu"

START_DATE = "2020-01-01"
END_DATE   = "2026-10-31"
TOTAL_MEMBERS = 12_000
CHUNK_SIZE = 100_000

SEG_DISTRIBUTION = {
    "SENATE":     0.25,
    "HOUSE":      0.33,
    "CONTRACTOR": 0.21,
    "RETIREE":    0.13,
    "MILITARY":   0.08,
}

LOAN_MIX = {
    "MORTGAGE":    0.42,
    "AUTO":        0.28,
    "PERSONAL":    0.18,
    "HELOC":       0.07,
    "CREDIT_CARD": 0.05,
}

SCENARIO_MODIFIERS = {
    "GOVERNMENT_SHUTDOWN": {
        "delinquency_rate":   1.6,
        "modification_rate":  2.2,
        "deposit_withdrawal": 1.4,
        "loan_app_volume":    0.7,
        "new_member_rate":    0.8,
    },
    "CONTINUING_RESOLUTION": {
        "delinquency_rate":   1.15,
        "loan_app_volume":    0.9,
        "deposit_withdrawal": 1.1,
    },
    "COVID_EMERGENCY": {
        "modification_rate":  10.0,
        "loan_app_volume":    0.45,
        "deposit_balance":    1.18,
        "delinquency_rate":   0.6,
        "digital_sessions":   4.0,
        "branch_traffic":     0.05,
    },
    "STIMULUS_ACTIVE": {
        "deposit_balance":    1.25,
        "loan_payoff_rate":   1.4,
        "new_member_rate":    1.2,
    },
    "POST_PANDEMIC_NORMALIZATION": {
        "delinquency_rate":   1.9,
        "modification_rate":  0.3,
    },
    "ZERO_RATE_ENV": {
        "nim_modifier":          0.78,
        "certificate_renewal":   0.55,
        "deposit_cost_modifier": 0.3,
    },
    "RATE_HIKE_CYCLE": {
        "mortgage_app_volume":   0.38,
        "deposit_cost_modifier": 1.8,
        "nim_modifier":          1.22,
        "certificate_demand":    1.9,
    },
    "MILITARY_SURGE": {
        "scra_activation_rate": 3.5,
        "mla_check_volume":     2.0,
    },
    "DEBT_CEILING_CRISIS": {
        "deposit_withdrawal": 1.25,
        "loan_app_volume":    0.85,
        "new_member_rate":    0.9,
    },
    "BANKING_SECTOR_STRESS": {
        "new_member_rate":  2.5,
        "deposit_inflow":   1.35,
    },
    "CONGRESSIONAL_TRANSITION": {
        "closed_member_rate": 2.0,
        "new_member_rate":    1.8,
    },
}

SCENARIO_PERIODS = [
    ("2018-01-20", "2018-01-22", "GOVERNMENT_SHUTDOWN"),
    ("2018-12-22", "2019-01-25", "GOVERNMENT_SHUTDOWN"),
    ("2020-01-13", "2020-03-12", "CONTINUING_RESOLUTION"),
    ("2020-03-13", "2021-06-30", "COVID_EMERGENCY"),
    ("2021-04-01", "2021-09-30", "STIMULUS_ACTIVE"),
    ("2021-07-01", "2022-03-15", "POST_PANDEMIC_NORMALIZATION"),
    ("2020-03-16", "2022-03-16", "ZERO_RATE_ENV"),
    ("2022-03-17", "2023-07-26", "RATE_HIKE_CYCLE"),
    ("2020-03-01", "2021-12-31", "MILITARY_SURGE"),
    ("2023-05-01", "2023-06-15", "DEBT_CEILING_CRISIS"),
    ("2023-03-10", "2023-05-31", "BANKING_SECTOR_STRESS"),
    ("2021-01-03", "2021-01-10", "CONGRESSIONAL_TRANSITION"),
    ("2023-01-03", "2023-01-10", "CONGRESSIONAL_TRANSITION"),
    ("2023-09-01", "2023-10-31", "CONTINUING_RESOLUTION"),
    ("2025-01-03", "2025-01-10", "CONGRESSIONAL_TRANSITION"),
    ("2026-01-15", "2026-02-10", "GOVERNMENT_SHUTDOWN"),
]

BRANCHES = [
    {"code": "CAP", "name": "Capitol Hill",  "city": "Washington", "state": "DC", "zip": "20510", "region": "Metro DC"},
    {"code": "PEN", "name": "Pentagon City", "city": "Arlington",  "state": "VA", "zip": "22202", "region": "Northern VA"},
    {"code": "ROC", "name": "Rockville",     "city": "Rockville",  "state": "MD", "zip": "20850", "region": "Maryland"},
    {"code": "ALX", "name": "Alexandria",    "city": "Alexandria", "state": "VA", "zip": "22314", "region": "Northern VA"},
]
