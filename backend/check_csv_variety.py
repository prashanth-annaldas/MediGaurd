import csv
import collections

CSV_PATH = r"c:\Users\annal\Downloads\200_hospitals_5_years_with_doctors_expanded\200_hospitals_5_years_with_doctors_expanded.csv"

def analyze():
    doctor_names = collections.defaultdict(set)
    ratings = collections.defaultdict(set)
    stories = collections.defaultdict(set)
    
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            h_name = row['Hospital_Name']
            d_name = row.get('Doctor_Name')
            d_rating = row.get('Doctor_Rating_Percent')
            d_stories = row.get('Doctor_Patient_Stories')
            
            if d_name:
                doctor_names[h_name].add(d_name)
            if d_rating:
                ratings[h_name].add(d_rating)
            if d_stories:
                stories[h_name].add(d_stories)
                
    # Check first 5 hospitals
    hospitals = list(doctor_names.keys())[:5]
    for h in hospitals:
        print(f"\nHospital: {h}")
        print(f"  Doctors: {doctor_names[h]}")
        print(f"  Ratings: {ratings[h]}")
        print(f"  Stories: {stories[h]}")

if __name__ == "__main__":
    analyze()
