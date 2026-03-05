from database import SessionLocal
import models
import auth

db = SessionLocal()
try:
    # Check if doctor already exists
    from sqlalchemy import delete
    db.query(models.User).filter(models.User.email == "sarah@gmail.com").delete()
    db.commit()
    
    hashed_pw = auth.get_password_hash("password")
    new_user = models.User(
        name="Sarah Johnson",
        email="sarah@gmail.com",
        password=hashed_pw,
        role="DOCTOR",
        hospital_name="City Hospital 17"
    )
    db.add(new_user)
    db.commit()
    print("Doctor sarah@gmail.com seeded with password 'password'")
finally:
    db.close()
