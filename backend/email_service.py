import os
import requests
from dotenv import load_dotenv

load_dotenv()

def send_appointment_email(
    patient_name: str,
    patient_email: str,
    doctor_name: str,
    appointment_date: str,
    appointment_time: str,
    reason: str,
    appointment_id: int
):
    """
    Sends an appointment notification email securely via Brevo's HTTP API.
    Render allows outbound HTTP traffic (port 443), thus bypassing SMTP blocks.
    """
    # Fetch from environment
    API_KEY = os.getenv("BREVO_API_KEY") 
    SENDER_EMAIL = os.getenv("EMAIL_USER", "prashanthannaldas@gmail.com") 
    
    # Defensive check: if credentials aren't set, just log and return
    if not API_KEY:
        print("⚠️ Email API key (BREVO_API_KEY) is missing. Skipping email notification. Sign up at brevo.com to get a free API key.", flush=True)
        return False

    API_KEY = API_KEY.strip()

    # The doctor's receiver email as per requirement
    receiver_email = "prashanthannaldas453@gmail.com"

    subject = "New Appointment Booked – MedGuard"
    
    body = f"""Hello Doctor,

A new appointment has been scheduled.

Patient Name: {patient_name}
Patient Email: {patient_email}
Doctor: {doctor_name or 'General Request'}
Date: {appointment_date}
Time: {appointment_time}
Reason: {reason or 'Not Specified'}
Appointment ID: {appointment_id}

Please login to MedGuard to view the full appointment details.

Regards,
MedGuard System
"""

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": API_KEY,
        "content-type": "application/json"
    }
    
    payload = {
        "sender": {
            "name": "MedGuard System",
            "email": SENDER_EMAIL
        },
        "to": [
            {
                "email": receiver_email,
                "name": "Doctor Prashanth"
            }
        ],
        "subject": subject,
        "textContent": body
    }

    try:
        print(f"DEBUG EMAIL: Sending via Brevo HTTP API to {receiver_email}...", flush=True)
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code in [200, 201]:
            print(f"✅ Appointment email sent to {receiver_email} for Appointment #{appointment_id}", flush=True)
            return True
        else:
            print(f"❌ Failed to send appointment email. Status: {response.status_code}, Response: {response.text}", flush=True)
            return False
    except Exception as e:
        print(f"❌ Exception in HTTP email service: {e}", flush=True)
        return False
