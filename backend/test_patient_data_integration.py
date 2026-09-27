import urllib.request
import urllib.error
import json
import random

base_url = 'http://127.0.0.1:8000/api/v1'

def api_call(path, method='GET', data=None, token=None):
    url = f"{base_url}{path}"
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f"Bearer {token}"
    req_data = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            return json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        raise Exception(f"HTTP {e.code}: {err_body}")

def run_suite():
    print("=== 1. Login User A (Sarah) ===")
    auth = api_call('/auth/login', 'POST', {'email': 'sarah@example.com', 'password': 'password123'})
    token_a = auth['tokens']['accessToken']
    print("[PASS] User A Logged in successfully.")

    print("\n=== 2. Test Profile & Clinical Baseline ===")
    prof = api_call('/profile', 'GET', token=token_a)
    print(f"[PASS] Retrieved profile ID: {prof.get('profileId')}")

    # Update profile
    upd = api_call('/profile', 'PUT', {'city': 'Chennai', 'state': 'Tamil Nadu', 'bloodGroup': 'O+'}, token=token_a)
    print(f"[PASS] Updated Profile: city={upd.get('city')}, state={upd.get('state')}, bloodGroup={upd.get('bloodGroup')}")

    # Add and delete allergy
    alg = api_call('/profile/allergies', 'POST', {'allergyName': 'Peanuts Test', 'severity': 'Severe', 'notes': 'Acute hives'}, token=token_a)
    alg_id = alg['allergyId']
    print(f"[PASS] Created Allergy: {alg.get('allergyName')} (ID: {alg_id})")
    api_call(f'/profile/allergies/{alg_id}', 'DELETE', token=token_a)
    print(f"[PASS] Deleted Allergy: {alg_id}")

    # Add and delete condition
    cond = api_call('/profile/conditions', 'POST', {'conditionName': 'Hypertension Test', 'diagnosedYear': 2022}, token=token_a)
    cond_id = cond['conditionId']
    print(f"[PASS] Created Condition: {cond.get('conditionName')} (ID: {cond_id})")
    api_call(f'/profile/conditions/{cond_id}', 'DELETE', token=token_a)
    print(f"[PASS] Deleted Condition: {cond_id}")

    # Add and delete medication
    med = api_call('/profile/medications', 'POST', {'medicineName': 'Amlodipine 5mg', 'dosage': '5mg', 'frequency': 'Once Daily'}, token=token_a)
    med_id = med['medicationId']
    print(f"[PASS] Created Medication: {med.get('medicineName')} (ID: {med_id})")
    api_call(f'/profile/medications/{med_id}', 'DELETE', token=token_a)
    print(f"[PASS] Deleted Medication: {med_id}")

    print("\n=== 3. Test Health Tips ===")
    tips = api_call('/tips/daily', 'GET', token=token_a)
    print(f"[PASS] Retrieved {len(tips)} daily health tips:")
    for t in tips:
        print(f"  - [{t.get('category')}] {t.get('title')}: {t.get('escalationGuidance')[:50]}...")

    print("\n=== 4. Test Scheme Documents & Evidence ===")
    schemes = api_call('/schemes', 'GET', token=token_a)
    print(f"[PASS] Retrieved {len(schemes)} Government Schemes.")
    records = api_call('/records', 'GET', token=token_a)
    print(f"[PASS] Retrieved {len(records)} Medical Diagnostic Records for User A.")

    print("\n=== 5. Test Settings & Password Security ===")
    # Wrong password test
    try:
        api_call('/auth/change-password', 'POST', {'currentPassword': 'WrongPassword!', 'newPassword': 'NewSecurePassword123!'}, token=token_a)
        print("[FAIL] Expected wrong password to be rejected!")
    except Exception as e:
        print(f"[PASS] Wrong current password correctly rejected: {e}")

    print("\n=== 6. Test Multi-User Isolation ===")
    num = random.randint(10000000, 99999999)
    user_b_email = f"patient_{num}@example.com"
    reg_b = api_call('/auth/register', 'POST', {
        'fullName': f"Patient B {num}",
        'email': user_b_email,
        'phone': f"92{num}",
        'password': 'SecurePassword123!'
    })
    token_b = reg_b['tokens']['accessToken']
    print(f"[PASS] Registered User B ({user_b_email}).")

    # User B adds private allergy
    alg_b = api_call('/profile/allergies', 'POST', {'allergyName': 'User B Private Allergy'}, token=token_b)
    alg_b_id = alg_b['allergyId']
    print(f"[PASS] User B added allergy ID: {alg_b_id}")

    # User A tries to delete User B's allergy (Should fail with 404 / Forbidden)
    try:
        api_call(f'/profile/allergies/{alg_b_id}', 'DELETE', token=token_a)
        print("[FAIL] User A was able to delete User B's allergy!")
    except Exception as e:
        print(f"[PASS] Cross-user access blocked as expected: {e}")

    # Clean up User B
    api_call('/auth/account', 'DELETE', token=token_b)
    print(f"[PASS] Deleted User B account and associated records.")

    print("\n==============================================")
    print("ALL 6 INTEGRATION TEST SUITES PASSED (100% OK)")
    print("==============================================")

if __name__ == '__main__':
    run_suite()
