import csv

csv_path = r'c:\Users\annal\Downloads\200_hospitals_5_years_with_doctors_expanded\200_hospitals_5_years_with_doctors_expanded.csv'

with open(csv_path, 'r') as f:
    reader = csv.reader(f)
    headers = next(reader)
    row_1 = next(reader)
    
    with open('csv_inspection.txt', 'w') as out:
        out.write("HEADERS:\n")
        for h in headers:
            out.write(f"- {h}\n")
        out.write("\nFIRST ROW:\n")
        for h, v in zip(headers, row_1):
            out.write(f"{h}: {v}\n")
