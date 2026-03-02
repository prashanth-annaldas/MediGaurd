import csv
import requests
import random
import os

CSV_PATH = r"c:\Users\annal\Downloads\200_hospitals_last_1_year_with_famous_hospitals.csv"
API_URL = "http://localhost:8000/api/hospitals/seed"

SPECIALTIES_LIST = ["Cardiology", "Neurology", "Oncology", "Pediatrics", "Orthopedics", "Emergency", "Surgery", "Gastroenterology", "Ophthalmology", "Urology", "Psychiatry"]

def seed_from_csv():
    if not os.path.exists(CSV_PATH):
        print(f"ERROR: CSV file not found at {CSV_PATH}")
        return

    hospital_data = {}

    with open(CSV_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row['Hospital_Name']
            # We want the latest date for each hospital. 
            # Since the CSV seems to be ordered by date, the last occurrence is likely the latest.
            date = row['Date']
            
            # Simplified: just update with the row values, last one wins.
            hospital_data[name] = {
                "name": name,
                "city": row['City'],
                "address": f"{random.randint(1, 999)} Medical St, {row['City']}",
                "latitude": 17.3850 + random.uniform(-0.1, 0.1), # Default to Hyderabad area if city is Unknown, else we could map cities
                "longitude": 78.4867 + random.uniform(-0.1, 0.1),
                "rating": round(random.uniform(3.5, 5.0), 1),
                "total_beds": int(row['Total_Beds']),
                "available_beds": int(row['Available_Beds']),
                "icu_total": int(row['ICU_Total']),
                "icu_available": int(row['ICU_Available']),
                "ventilators_total": int(row['Ventilators_Total']),
                "ventilators_available": int(row['Ventilators_Available']),
                "specialties": random.sample(SPECIALTIES_LIST, random.randint(2, 5))
            }

    payload = list(hospital_data.values())
    print(f"Found {len(payload)} unique hospitals. Sending to API...")

    try:
        # Send in chunks if it's too large, but 200 should be fine for one request.
        response = requests.post(API_URL, json=payload)
        if response.status_code == 200:
            print(f"SUCCESS: {response.json()['message']}")
        else:
            print(f"FAILED: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"API ERROR: {e}")

if __name__ == "__main__":
    seed_from_csv()
