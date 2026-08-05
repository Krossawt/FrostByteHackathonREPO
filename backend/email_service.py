"""
eSKala — Email Service
Sends OTP verification emails via Gmail SMTP using Python's built-in smtplib.
No additional pip packages required.

Configuration (backend/.env):
    EMAIL_HOST_USER=your-gmail@gmail.com
    EMAIL_HOST_PASSWORD=your-16-char-app-password
"""

import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")


def send_otp_email(to_email: str, otp_code: str, user_name: str = "") -> None:
    """
    Send a 6-digit OTP verification email to the given address.

    Raises:
        RuntimeError: if EMAIL_HOST_USER / EMAIL_HOST_PASSWORD are not configured,
                      or if SMTP delivery fails.
    """
    if not EMAIL_HOST_USER or not EMAIL_HOST_PASSWORD:
        raise RuntimeError(
            "Email credentials not configured. "
            "Set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in backend/.env"
        )

    greeting = f"Hi {user_name}," if user_name else "Hello,"

    html_body = f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>eSKala — Email Verification</title>
</head>
<body style="margin:0;padding:0;background:#F5F4EE;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F4EE;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:6px;overflow:hidden;
                      box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#760031;padding:28px 32px;text-align:center;">
              <span style="font-size:26px;font-weight:900;color:#ffffff;
                           letter-spacing:-0.5px;">
                e<span style="color:#FEEC41;">SK</span>ala
              </span>
              <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.75);
                        letter-spacing:0.08em;text-transform:uppercase;">
                City of Santa Rosa · Sangguniang Kabataan
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 8px;font-size:15px;color:#1a1a1a;">{greeting}</p>
              <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
                You're one step away from joining eSKala. Use the verification
                code below to complete your citizen account registration.
              </p>

              <!-- OTP Box -->
              <div style="background:#F5F4EE;border:2px solid #760031;border-radius:6px;
                          text-align:center;padding:24px 32px;margin:0 0 28px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;
                          color:#760031;letter-spacing:0.14em;
                          text-transform:uppercase;">Your Verification Code</p>
                <p style="margin:0;font-size:42px;font-weight:900;
                          letter-spacing:10px;color:#1a1a1a;font-family:monospace;">
                  {otp_code}
                </p>
                <p style="margin:10px 0 0;font-size:12px;color:#888;">
                  Valid for <strong>5 minutes</strong> · Do not share this code
                </p>
              </div>

              <p style="margin:0 0 16px;font-size:13px;color:#666;line-height:1.6;">
                If you did not request this, you can safely ignore this email.
                Someone may have entered your address by mistake.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F0EEE6;padding:18px 40px;border-top:1px solid #e0ddd4;">
              <p style="margin:0;font-size:11px;color:#999;text-align:center;line-height:1.7;">
                eSKala · City Government of Santa Rosa, Laguna · CYDO<br/>
                This is an automated message. Please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    text_body = (
        f"{greeting}\n\n"
        f"Your eSKala verification code is: {otp_code}\n\n"
        f"This code is valid for 5 minutes.\n\n"
        f"If you did not request this, ignore this email.\n\n"
        f"— eSKala Team, City of Santa Rosa"
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"eSKala — Your Verification Code: {otp_code}"
    msg["From"] = f"eSKala <{EMAIL_HOST_USER}>"
    msg["To"] = to_email

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
            server.sendmail(EMAIL_HOST_USER, to_email, msg.as_string())
    except smtplib.SMTPAuthenticationError:
        raise RuntimeError(
            "Gmail authentication failed. "
            "Ensure EMAIL_HOST_USER and EMAIL_HOST_PASSWORD (App Password) are correct."
        )
    except Exception as exc:
        raise RuntimeError(f"Failed to send OTP email: {exc}") from exc
