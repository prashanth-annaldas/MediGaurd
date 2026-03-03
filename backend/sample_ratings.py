import csv
CSV_PATH = r"c:\Users\annal\Downloads\200_hospitals_5_years_with_doctors_expanded\200_hospitals_5_years_with_doctors_expanded.csv"
with open(CSV_PATH, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    count = 0
    h_ratings = {}
    for row in reader:
        name = row['Hospital_Name']
        rating = row['Hospital_Rating']
        if name not in h_ratings:
            h_ratings[name] = rating
            print(f"{name}: {rating}")
            count += 1
        if count >= 20:
            break
