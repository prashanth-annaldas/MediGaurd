import csv
import collections

CSV_PATH = r"c:\Users\annal\Downloads\200_hospitals_5_years_with_doctors_expanded\200_hospitals_5_years_with_doctors_expanded.csv"

def analyze_full():
    all_ratings = collections.Counter()
    all_stories = collections.Counter()
    all_doctor_names = collections.Counter()
    
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        print(f"Columns: {reader.fieldnames}")
        for row in reader:
            all_ratings[row.get('Doctor_Rating_Percent')] += 1
            all_stories[row.get('Doctor_Patient_Stories')] += 1
            all_doctor_names[row.get('Doctor_Name')] += 1
                
    print(f"Unique Doctor Names Found: {list(all_doctor_names.keys())}")
    print(f"Number of Unique Doctors: {len(all_doctor_names)}")
    print(f"Top Ratings: {all_ratings.most_common(10)}")
    print(f"Top Stories: {all_stories.most_common(10)}")

if __name__ == "__main__":
    analyze_full()
