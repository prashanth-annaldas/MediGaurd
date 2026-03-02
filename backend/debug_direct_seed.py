from database import SessionLocal
import models
import traceback

def debug_seed():
    db = SessionLocal()
    try:
        hospitals = [
          {
            "name": "City General Hospital",
            "address": "123 Medical Ave, Metropolis",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "rating": 4.8,
            "total_resources": 500,
            "available_resources": 350,
            "specialties": ["Surgery", "Emergency", "Cardiology"]
          }
        ]
        
        new_hospitals = []
        for h in hospitals:
            new_hospitals.append(models.Hospital(
                name=h["name"],
                address=h["address"],
                latitude=h["latitude"],
                longitude=h["longitude"],
                rating=h["rating"],
                total_resources=h["total_resources"],
                available_resources=h["available_resources"],
                specialties=",".join(h["specialties"])
            ))
        db.add_all(new_hospitals)
        db.commit()
        print("SUCCESS: Seeded 1 hospital directly.")
    except Exception:
        print("FAILED: Direct seed failed.")
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_seed()
