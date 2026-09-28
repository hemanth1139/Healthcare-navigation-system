import json

with open('healthcare_schemes.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total schemes: {len(data)}")
tn_schemes = []
central_schemes = []
other_state_schemes = []

for s in data:
    st = s.get('state', '')
    if "Tamil Nadu" in st and "Central" not in st and "All India" not in st:
        tn_schemes.append(s)
    elif "Central" in st or "All India" in st or "India" in st:
        central_schemes.append(s)
    else:
        other_state_schemes.append(s)

print(f"\n--- TAMIL NADU SCHEMES ({len(tn_schemes)}) ---")
for s in tn_schemes:
    print(f"[{s['scheme_id']}] {s['scheme_name']} ({s.get('state')})")

print(f"\n--- CENTRAL SCHEMES ({len(central_schemes)}) ---")
for s in central_schemes:
    print(f"[{s['scheme_id']}] {s['scheme_name']} ({s.get('state')})")

print(f"\n--- OTHER STATE SCHEMES ({len(other_state_schemes)}) ---")
for s in other_state_schemes:
    print(f"[{s['scheme_id']}] {s['scheme_name']} ({s.get('state')})")
