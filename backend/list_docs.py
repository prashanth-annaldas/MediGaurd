import sqlite3
import json

def list_doctors(hospital_name):
    conn = sqlite3.connect('medguard.db')
    cursor = conn.cursor()
    cursor.execute('SELECT doctors FROM hospitals WHERE name=?', (hospital_name,))
    row = cursor.fetchone()
    if row:
        doctors = json.loads(row[0])
        print(f"Doctors at {hospital_name}:")
        for d in doctors:
            print(f"- {d.get('name')}")
    else:
        print(f"Hospital {hospital_name} not found")
    conn.close()

if __name__ == "__main__":
    list_doctors("City Hospital 17")
