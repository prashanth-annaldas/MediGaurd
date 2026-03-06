"""
Email utility for MedGuard — sends appointment confirmation emails via Gmail SMTP.
Uses SENDER_EMAIL, SENDER_EMAIL_PASSKEY from .env
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SENDER_EMAIL = os.getenv("SENDER_EMAIL", "")
SENDER_PASSKEY = os.getenv("SENDER_EMAIL_PASSKEY", "")


def send_appointment_email(
    receiver_email: str,
    patient_name: str,
    hospital_name: str,
    specialization: str,
    doctor_name: str | None,
    date: str,
    time: str,
):
    """Send a styled appointment confirmation email."""
    if not SENDER_EMAIL or not SENDER_PASSKEY:
        print("⚠️ Email not configured — skipping notification.")
        return False

    subject = f"✅ Appointment Confirmed — {hospital_name}"

    html = f"""\
    <html>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8;">
      <div style="max-width:520px;margin:30px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#0f766e,#14b8a6);padding:28px 24px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:22px;">🏥 MedGuard</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Appointment Confirmation</p>
        </div>
        <!-- Body -->
        <div style="padding:28px 24px;">
          <p style="font-size:15px;color:#334155;">Hi <strong>{patient_name}</strong>,</p>
          <p style="font-size:14px;color:#475569;line-height:1.6;">
            Your appointment has been successfully booked. Here are the details:
          </p>
          <table style="width:100%;border-collapse:collapse;margin:18px 0;">
            <tr>
              <td style="padding:10px 12px;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;">Hospital</td>
              <td style="padding:10px 12px;font-size:14px;color:#0f172a;font-weight:600;border-bottom:1px solid #e2e8f0;">{hospital_name}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;">Specialization</td>
              <td style="padding:10px 12px;font-size:14px;color:#0f172a;font-weight:600;border-bottom:1px solid #e2e8f0;">{specialization}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;">Doctor</td>
              <td style="padding:10px 12px;font-size:14px;color:#0f172a;font-weight:600;border-bottom:1px solid #e2e8f0;">{doctor_name or 'To be assigned'}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;">Date</td>
              <td style="padding:10px 12px;font-size:14px;color:#0f172a;font-weight:600;border-bottom:1px solid #e2e8f0;">{date}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;font-size:13px;color:#64748b;">Time</td>
              <td style="padding:10px 12px;font-size:14px;color:#0f172a;font-weight:600;">{time}</td>
            </tr>
          </table>
          <p style="font-size:13px;color:#64748b;line-height:1.5;">
            Please arrive 15 minutes before your scheduled time. Bring any relevant medical records.
          </p>
        </div>
        <!-- Footer -->
        <div style="background:#f8fafc;padding:16px 24px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">Powered by MedGuard AI · Privacy-preserving healthcare</p>
        </div>
      </div>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SENDER_EMAIL
    msg["To"] = receiver_email
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSKEY)
            server.sendmail(SENDER_EMAIL, receiver_email, msg.as_string())
        print(f"📧 Appointment email sent to {receiver_email}")
        return True
    except Exception as e:
        print(f"❌ Email sending failed: {e}")
        return False
