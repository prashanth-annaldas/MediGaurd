"""
Seed 5-year hospital history from CSV.
Aggregates daily rows into monthly averages and writes directly to SQLite to avoid timeouts.
"""
import csv
import os
from collections import defaultdict
from database import SessionLocal
from models import HospitalHistory

CSV_PATH = r"c:\Users\annal\Downloads\200_hospitals_last_5_years_dataset.csv"

def run():
    if not os.path.exists(CSV_PATH):
        print(f"ERROR: CSV file not found at {CSV_PATH}")
        return

    print(f"Reading CSV: {CSV_PATH} ...")
    
    # monthly_data[(hospital, city, year, month)] = {sums, counts}
    monthly = defaultdict(lambda: {
        "bed_occ_sum": 0.0, "icu_occ_sum": 0.0,
        "vent_sum": 0.0, "admissions_sum": 0.0,
        "shortage_days": 0, "count": 0,
        "city": ""
    })

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            hospital = row["Hospital_Name"].strip()
            city     = row["City"].strip()
            date     = row["Date"].strip()  # YYYY-MM-DD
            try:
                year  = int(date[:4])
                month = int(date[5:7])
            except Exception:
                continue

            key = (hospital, city, year, month)
            d = monthly[key]
            d["city"] = city
            try:
                d["bed_occ_sum"]      += float(row["Bed_Occupancy_Rate"])
                d["icu_occ_sum"]      += float(row["ICU_Occupancy_Rate"])
                d["vent_sum"]         += float(row["Ventilator_Utilization_Rate"])
                d["admissions_sum"]   += float(row["Daily_Admissions"])
                d["shortage_days"]    += int(row["Resource_Shortage_Flag"])
                d["count"]            += 1
            except (ValueError, KeyError):
                pass

    records = []
    for (hospital, city, year, month), d in monthly.items():
        c = d["count"]
        if c == 0:
            continue
        records.append({
            "hospital_name":        hospital,
            "city":                 city,
            "year":                 year,
            "month":                month,
            "avg_bed_occupancy":    round(d["bed_occ_sum"] / c, 2),
            "avg_icu_occupancy":    round(d["icu_occ_sum"] / c, 2),
            "avg_ventilator_util":  round(d["vent_sum"] / c, 2),
            "avg_daily_admissions": round(d["admissions_sum"] / c, 2),
            "shortage_days":        d["shortage_days"],
        })

    print(f"Total monthly records to seed: {len(records)}")

    db = SessionLocal()
    total_seeded = 0
    try:
        for i, r in enumerate(records):
            existing = db.query(HospitalHistory).filter(
                HospitalHistory.hospital_name == r["hospital_name"],
                HospitalHistory.year == r["year"],
                HospitalHistory.month == r["month"],
            ).first()
            
            if existing:
                existing.avg_bed_occupancy = r["avg_bed_occupancy"]
                existing.avg_icu_occupancy = r["avg_icu_occupancy"]
                existing.avg_ventilator_util = r["avg_ventilator_util"]
                existing.avg_daily_admissions = r["avg_daily_admissions"]
                existing.shortage_days = r["shortage_days"]
            else:
                db.add(HospitalHistory(
                    hospital_name=r["hospital_name"],
                    city=r["city"],
                    year=r["year"],
                    month=r["month"],
                    avg_bed_occupancy=r["avg_bed_occupancy"],
                    avg_icu_occupancy=r["avg_icu_occupancy"],
                    avg_ventilator_util=r["avg_ventilator_util"],
                    avg_daily_admissions=r["avg_daily_admissions"],
                    shortage_days=r["shortage_days"],
                ))
            
            total_seeded += 1
            if (i + 1) % 500 == 0:
                db.commit()
                print(f"  Progress: {i+1}/{len(records)} seeded...")
        
        db.commit()
        print(f"\nDone — {total_seeded} total records processed in DB.")
    except Exception as e:
        db.rollback()
        print(f"ERROR during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run()
