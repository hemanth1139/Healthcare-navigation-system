import json

with open("healthcare_schemes.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"Total schemes in healthcare_schemes.json: {len(data)}")
for s in data:
    sid = s.get("scheme_id", "?")
    name = s.get("scheme_name", "?")
    keys = list(s.keys())
    print(f"  {sid}: {name}")

# Show one full scheme
print("\n--- SAMPLE SCHEME (first) ---")
print(json.dumps(data[0], indent=2, ensure_ascii=False))
