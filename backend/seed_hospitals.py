import requests
import json

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
  },
  {
    "name": "St. Jude Children's Research Hospital",
    "address": "262 Danny Thomas Pl, Memphis, TN",
    "latitude": 35.1495,
    "longitude": -90.0490,
    "rating": 4.9,
    "total_resources": 300,
    "available_resources": 150,
    "specialties": ["Pediatrics", "Oncology"]
  },
  {
    "name": "Mayo Clinic",
    "address": "200 First St SW, Rochester, MN",
    "latitude": 44.0225,
    "longitude": -92.4668,
    "rating": 5.0,
    "total_resources": 1000,
    "available_resources": 800,
    "specialties": ["Neurology", "Gastroenterology", "Research"]
  },
  {
    "name": "Johns Hopkins Hospital",
    "address": "1800 Orleans St, Baltimore, MD",
    "latitude": 39.2974,
    "longitude": -76.5925,
    "rating": 4.7,
    "total_resources": 800,
    "available_resources": 400,
    "specialties": ["Ophthalmology", "Urology", "Psychiatry"]
  },
  {
      "name": "Cleveland Clinic",
      "address": "9500 Euclid Ave, Cleveland, OH",
      "latitude": 41.5034,
      "longitude": -81.6212,
      "rating": 4.9,
      "total_resources": 900,
      "available_resources": 600,
      "specialties": ["Heart Surgery", "Kidney Transplant"]
  }
]

url = "http://localhost:8000/api/hospitals/seed"
response = requests.post(url, json=hospitals)

if response.status_code == 200:
    print(f"SUCCESS: {response.json()['message']}")
else:
    print(f"FAILED: {response.status_code} - {response.text}")
