import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

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
    Sends an appointment notification email to the doctor securely via Gmail SMTP.
    """
    # Defensive check: if credentials aren't set, just log and return
    if not EMAIL_USER or not EMAIL_PASS:
        print("⚠️ Email credentials (EMAIL_USER/EMAIL_PASS) are missing. Skipping email notification.")
        return False

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

Regards
MedGuard System
"""

    msg = EmailMessage()
    msg.set_content(body)
    msg["Subject"] = subject
    msg["From"] = EMAIL_USER
    msg["To"] = receiver_email

    try:
        # Use SMTP_SSL for port 465 (secure connection)
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(msg)
        print(f"✅ Appointment email sent to {receiver_email} for Appointment #{appointment_id}")
        return True
    except Exception as e:
        print(f"❌ Failed to send appointment email: {e}")
        return False
