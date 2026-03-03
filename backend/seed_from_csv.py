import csv
import requests
import random
import os
import hashlib

CSV_PATH = r"c:\Users\annal\Downloads\200_hospitals_5_years_with_doctors_expanded\200_hospitals_5_years_with_doctors_expanded.csv"
API_URL = "http://localhost:8000/api/hospitals/seed"

# Lists for doctor synthesis
FIRST_NAMES_F = ["Sneha", "Anjali", "Neha", "Pooja", "Divya", "Kavita", "Vandana", "Jasmine", "Soumya", "Priya", "Anusha", "Shruti", "Tanvi", "Megha", "Amrita", "Ishani"]
FIRST_NAMES_M = ["Rahul", "Amit", "Vikram", "Rohan", "Aditya", "Karthik", "Suresh", "Ramesh", "Sanjay", "Kiran", "Praveen", "Ravi", "Varun", "Sumit", "Abhishek", "Deepak"]
LAST_NAMES = ["Sharma", "Patel", "Reddy", "Singh", "Kumar", "Iyer", "Nair", "Rao", "Gowda", "Verma", "Menon", "Deshmukh", "Hegde", "Salkar", "Bose", "Chatterjee"]
SPECIALTIES_LIST = ["Cardiology", "Neurology", "Oncology", "Pediatrics", "Orthopedics", "Emergency", "Surgery", "Gastroenterology", "Ophthalmology", "Urology", "Psychiatry", "Dermatology", "Endocrinology", "ENT", "Gynecology"]

def get_seeded_random(seed_str):
    """Returns a random.Random instance seeded by a string hash."""
    seed_hash = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
    return random.Random(seed_hash)

def seed_from_csv():
    if not os.path.exists(CSV_PATH):
        print(f"ERROR: CSV file not found at {CSV_PATH}")
        return

    hospital_data = {}

    with open(CSV_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row['Hospital_Name']
            
            if name not in hospital_data:
                # Deterministic random for this hospital
                h_rng = get_seeded_random(name)
                
                # Jitter hospital rating (3.8 - 5.0) and count (100 - 5000)
                # Since CSV has static 5.0 and 575
                base_rating = float(row.get('Hospital_Rating', 4.5))
                base_count = int(row.get('Total_Ratings_Count', 500))
                
                jitter_h_rating = round(max(3.5, min(5.0, base_rating - h_rng.uniform(0, 1.2))), 1)
                jitter_h_count = int(base_count * h_rng.uniform(0.5, 8.0))

                hospital_data[name] = {
                    "name": name,
                    "city": row['City'],
                    "address": f"{random.randint(1, 999)} Medical St, {row['City']}",
                    "latitude": 17.3850 + random.uniform(-0.1, 0.1),
                    "longitude": 78.4867 + random.uniform(-0.1, 0.1),
                    "rating": jitter_h_rating,
                    "rating_count": jitter_h_count,
                    "fee_min": int(row.get('Consultation_Fee_Min', 500)),
                    "fee_max": int(row.get('Consultation_Fee_Max', 800)),
                    "total_doctors": int(row.get('Total_Doctors_Listed', 10)),
                    "open_24x7": int(row.get('Open_24x7', 1)),
                    "total_beds": int(row['Total_Beds']),
                    "available_beds": int(row['Available_Beds']),
                    "icu_total": int(row['ICU_Total']),
                    "icu_available": int(row['ICU_Available']),
                    "ventilators_total": int(row['Ventilators_Total']),
                    "ventilators_available": int(row['Ventilators_Available']),
                    "specialties": [],
                    "doctors": {}, # key by doctor name to unique
                }
            else:
                # Update latest resource data since it goes day by day
                hospital_data[name]["available_beds"] = int(row['Available_Beds'])
                hospital_data[name]["icu_available"] = int(row['ICU_Available'])
                hospital_data[name]["ventilators_available"] = int(row['Ventilators_Available'])
            
            # Extract doctor
            doctor_name = row.get("Doctor_Name", "")
            if doctor_name and doctor_name not in hospital_data[name]["doctors"]:
                spec = row.get("Doctor_Specialization", "General Physician")
                
                # Use hash for consistent visual variety
                gender = "women" if any(x in doctor_name.lower() for x in ["sneha", "neha", "anjali", "pooja", "female"]) else "men"
                r_img = (int(hashlib.md5((name + doctor_name).encode()).hexdigest(), 16) % 99) + 1
                
                hospital_data[name]["doctors"][doctor_name] = {
                    "name": doctor_name,
                    "specialty": spec,
                    "experience": f"{row.get('Doctor_Experience_Years', '10')} years experience",
                    "stories": f"{row.get('Doctor_Rating_Percent', '95')}% • {row.get('Doctor_Patient_Stories', '500')} Patient Stories",
                    "image": f"https://randomuser.me/api/portraits/{gender}/{r_img}.jpg"
                }
                
                if spec not in hospital_data[name]["specialties"]:
                    hospital_data[name]["specialties"].append(spec)

    # Convert to list and synthesize variety
    payload = []
    for h_name, h_data in hospital_data.items():
        # Deterministic random for this hospital
        h_rng = get_seeded_random(h_name)
        
        # Unique names for the "base" doctors from CSV to avoid repetition
        raw_doctors = list(h_data["doctors"].values())
        transformed_doctors = []
        
        for idx, doc in enumerate(raw_doctors):
            # If it's one of the common names or we just want more variety
            # We'll synthesize a unique name for THIS hospital record
            is_f = "women" in doc["image"]
            f_name = h_rng.choice(FIRST_NAMES_F if is_f else FIRST_NAMES_M)
            l_name = h_rng.choice(LAST_NAMES)
            unique_name = f"Dr. {f_name} {l_name}"
            
            # Apply jitter to ratings and stories
            # Base rating +/- 5%, Base stories +/- 20%
            try:
                base_rating = int(doc["stories"].split("%")[0])
                base_stories = int(doc["stories"].split("•")[1].split()[0])
            except:
                base_rating = h_rng.randint(85, 98)
                base_stories = h_rng.randint(50, 500)

            jitter_rating = max(80, min(99, base_rating + h_rng.randint(-5, 5)))
            jitter_stories = max(10, int(base_stories * h_rng.uniform(0.8, 1.2)))
            
            transformed_doctors.append({
                "name": unique_name,
                "specialty": doc["specialty"],
                "experience": doc["experience"],
                "stories": f"{jitter_rating}% • {jitter_stories} Patient Stories",
                "image": doc["image"] # Keep the image but the name is unique
            })

        h_data["doctors"] = transformed_doctors
        
        # Synthesize even MORE doctors if needed to reach total_doctors count
        target_count = h_data["total_doctors"]
        if len(h_data["doctors"]) < target_count:
            # Show up to 10 doctors total for high variety
            synth_limit = min(target_count, 10) 
            while len(h_data["doctors"]) < synth_limit:
                is_f = h_rng.random() > 0.5
                f_name = h_rng.choice(FIRST_NAMES_F if is_f else FIRST_NAMES_M)
                l_name = h_rng.choice(LAST_NAMES)
                name = f"Dr. {f_name} {l_name}"
                
                if any(d["name"] == name for d in h_data["doctors"]):
                    continue
                
                spec = h_rng.choice(SPECIALTIES_LIST)
                exp = h_rng.randint(5, 25)
                rating = h_rng.randint(85, 99)
                stories = h_rng.randint(50, 2000)
                
                gender = "women" if is_f else "men"
                r_img = (int(hashlib.md5((h_name + name).encode()).hexdigest(), 16) % 99) + 1

                h_data["doctors"].append({
                    "name": name,
                    "specialty": spec,
                    "experience": f"{exp} years experience",
                    "stories": f"{rating}% • {stories} Patient Stories",
                    "image": f"https://randomuser.me/api/portraits/{gender}/{r_img}.jpg"
                })
                
                if spec not in h_data["specialties"]:
                    h_data["specialties"].append(spec)

        # Final shuffle for this hospital's doctor list
        h_rng.shuffle(h_data["doctors"])

        if not h_data["specialties"]:
            h_data["specialties"] = h_rng.sample(SPECIALTIES_LIST, h_rng.randint(3, 6))
            
        payload.append(h_data)

    print(f"Found {len(payload)} unique hospitals. Sending to API...")

    try:
        response = requests.post(API_URL, json=payload)
        if response.status_code == 200:
            print(f"SUCCESS: {response.json()['message']}")
        else:
            print(f"FAILED: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"API ERROR: {e}")

if __name__ == "__main__":
    seed_from_csv()
