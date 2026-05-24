import smtplib
from email.mime.text import MIMEText
import urllib.request
import json
from app.database import settings

def send_otp_email(to_email: str, otp_code: str):
    # Always print OTP to terminal — works as fallback when no SMTP server is configured
    print(f"\n{'='*50}")
    print(f"📧 OTP for {to_email}: {otp_code}")
    print(f"{'='*50}\n")

    smtp_host = settings.smtp_host
    smtp_port = settings.smtp_port
    smtp_user = settings.smtp_user
    smtp_pass = settings.smtp_pass
    resend_api_key = settings.resend_api_key

    # Option 1: Use Resend API if a key is provided
    if resend_api_key:
        try:
            url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {resend_api_key}",
                "Content-Type": "application/json"
            }
            data = {
                "from": "Acme Talent Hub <onboarding@resend.dev>",
                "to": [to_email],
                "subject": "Welcome! Verify your email",
                "html": f"<p>Your ACME Talent Hub confirmation code is: <strong>{otp_code}</strong></p><p>This code will expire in 15 minutes.</p>"
            }
            req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
            with urllib.request.urlopen(req) as response:
                print(f"✅ Resend: Successfully sent OTP [{otp_code}] to {to_email}")
            return
        except Exception as e:
            print(f"❌ Resend Error: {e} — OTP already printed to console above")
            return

    # Option 2: Skip email sending if no real SMTP host is configured
    if smtp_host in ("localhost", "127.0.0.1", "") or not smtp_user:
        print("ℹ️  No SMTP configured — OTP printed to console above (development mode)")
        return

    try:
        msg = MIMEText(f"Your ACME Talent Hub confirmation code is: {otp_code}\n\nThis code will expire in 15 minutes.")
        msg["Subject"] = "Welcome! Verify your email"
        msg["From"] = "noreply@acmetalenthub.com"
        msg["To"] = to_email

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.ehlo()
            server.starttls()
            if smtp_user and smtp_pass:
                server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        print(f"✅ SMTP: Successfully sent OTP [{otp_code}] to {to_email}")
    except Exception as e:
        print(f"❌ SMTP Error: {e} — OTP already printed to console above")
