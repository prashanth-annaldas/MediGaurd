from database import engine, Base
import models
import os

print(f"Current working directory: {os.getcwd()}")
db_path = "medguard.db"
print(f"Database path: {os.path.abspath(db_path)}")
print(f"Database exists before: {os.path.exists(db_path)}")

print("Creating tables...")
models.Base.metadata.create_all(bind=engine)
print("Tables created.")

import sqlite3
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
print(f"Tables in DB: {cursor.fetchall()}")
conn.close()
