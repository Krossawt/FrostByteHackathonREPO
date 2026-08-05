"""
eSKala — Email Service (Resend API)
Sends OTP emails via Resend's HTTPS API — works on Render free tier.
Raw SMTP (smtplib) is blocked by Render; this uses port 443 instead.

Setup:
  1. Sign up at https://resend.com (free, 100 emails/day)
  2. Go to API Keys → Create API Key → copy it
  3. Add to backend/.env:
       RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
  4. Also add to Render Environment Variables (same key/value)
"""

import os
import resend
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY", "")

SENDER_FROM = os.getenv("RESEND_FROM_EMAIL", "eSKala <onboarding@resend.dev>")


def send_otp_email(to_email: str, otp_code: str, user_name: str = "") -> None:
    """
    Send a formal, branded 6-digit OTP verification email via Resend.

    Raises:
        RuntimeError: if RESEND_API_KEY is missing or the API call fails.
    """


    display_name = user_name.split()[0] if user_name else "Citizen"
    otp_spaced = "  ".join(list(otp_code))  # e.g. "3  4  2  1  9  7" for readability

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>eSKala — Email Verification</title>
</head>
<body style="margin:0;padding:0;background:#EEEAE0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:#EEEAE0;padding:40px 16px;">
    <tr><td align="center">

      <!-- Card -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0"
             style="max-width:560px;width:100%;background:#ffffff;
                    border-radius:12px;overflow:hidden;
                    box-shadow:0 8px 40px rgba(0,0,0,0.10);">

        <!-- ── TOP ACCENT BAR ── -->
        <tr>
          <td style="height:5px;background:linear-gradient(90deg,#760031 0%,#A8003F 50%,#FEEC41 100%);"></td>
        </tr>

        <!-- ── HEADER ── -->
        <tr>
          <td style="background:#760031;padding:36px 48px 30px;text-align:center;">

            <!-- Logos row -->
            <table role="presentation" cellpadding="0" cellspacing="0" align="center"
                   style="margin:0 auto 18px;">
              <tr>
                <td style="padding:0 10px;vertical-align:middle;">
                  <div style="width:44px;height:44px;background:rgba(255,255,255,0.15);
                              border-radius:50%;display:inline-block;line-height:44px;
                              text-align:center;font-size:20px;font-weight:900;
                              color:#FEEC41;">SK</div>
                </td>
                <td style="width:1px;background:rgba(255,255,255,0.2);height:36px;
                           vertical-align:middle;"></td>
                <td style="padding:0 10px;vertical-align:middle;
                           font-size:11px;color:rgba(255,255,255,0.6);
                           text-transform:uppercase;letter-spacing:0.1em;
                           line-height:1.5;">
                  City of Santa Rosa<br/>Laguna, Philippines
                </td>
              </tr>
            </table>

            <!-- Brand name -->
            <div style="font-size:34px;font-weight:900;color:#ffffff;
                        letter-spacing:-1px;line-height:1;">
              e<span style="color:#FEEC41;">SK</span>ala
            </div>
            <div style="margin-top:6px;font-size:11px;color:rgba(255,255,255,0.6);
                        letter-spacing:0.2em;text-transform:uppercase;">
              SK Transparency Portal
            </div>
          </td>
        </tr>

        <!-- ── BODY ── -->
        <tr>
          <td style="padding:44px 48px 36px;">

            <!-- Greeting -->
            <p style="margin:0 0 6px;font-size:13px;color:#888;
                      text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">
              Email Verification
            </p>
            <h1 style="margin:0 0 20px;font-size:24px;font-weight:800;
                       color:#1a1a1a;line-height:1.2;">
              Good day, {display_name}.
            </h1>

            <!-- Message -->
            <p style="margin:0 0 28px;font-size:15px;color:#444;line-height:1.75;">
              You have initiated a citizen account registration on the
              <strong style="color:#760031;">eSKala SK Transparency Portal</strong>
              of the City of Santa Rosa, Laguna. To proceed and secure your account,
              please use the one-time verification code below.
            </p>

            <!-- OTP Box -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#FBF9F5;border:2px solid #760031;
                           border-radius:10px;padding:28px 32px;text-align:center;">

                  <div style="font-size:11px;font-weight:700;color:#760031;
                              letter-spacing:0.18em;text-transform:uppercase;
                              margin-bottom:14px;">
                    Your One-Time Verification Code
                  </div>

                  <!-- OTP digits -->
                  <div style="font-size:44px;font-weight:900;color:#1a1a1a;
                              letter-spacing:12px;font-family:'Courier New',monospace;
                              line-height:1;padding-left:12px;">
                    {otp_code}
                  </div>

                  <div style="margin-top:16px;display:inline-block;
                              background:#760031;border-radius:20px;
                              padding:5px 16px;">
                    <span style="font-size:11px;color:#ffffff;font-weight:700;
                                 letter-spacing:0.1em;text-transform:uppercase;">
                      Valid for 5 minutes only
                    </span>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Instructions -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                   style="margin-top:28px;">
              <tr>
                <td style="background:#FFF8E7;border-left:4px solid #FEEC41;
                           border-radius:0 6px 6px 0;padding:14px 18px;">
                  <p style="margin:0;font-size:13px;color:#6b4e00;line-height:1.65;">
                    <strong>How to use this code:</strong><br/>
                    Return to the eSKala registration page and enter this 6-digit code
                    in the verification field. Do <em>not</em> share this code with anyone —
                    eSKala staff will never ask for your OTP.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <hr style="margin:32px 0;border:none;border-top:1px solid #EEEBE3;" />

            <!-- Security notice -->
            <p style="margin:0;font-size:12px;color:#999;line-height:1.7;">
              If you did not initiate this request, please disregard this message.
              No action is required, and no account will be created without completing
              the verification step. For concerns, contact the City of Santa Rosa CYDO.
            </p>
          </td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td style="background:#F4F1E8;border-top:1px solid #E0DDD4;
                     padding:22px 48px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#888;line-height:1.6;">
              <strong style="color:#555;">eSKala</strong> — Official SK Transparency Portal<br/>
              City Government of Santa Rosa, Laguna &nbsp;·&nbsp;
              City Youth Development Office (CYDO)
            </p>
            <p style="margin:8px 0 0;font-size:10px;color:#bbb;letter-spacing:0.05em;
                      text-transform:uppercase;">
              This is a system-generated message. Please do not reply to this email.
            </p>
          </td>
        </tr>

        <!-- ── BOTTOM ACCENT BAR ── -->
        <tr>
          <td style="height:4px;background:linear-gradient(90deg,#FEEC41 0%,#760031 100%);"></td>
        </tr>

      </table>
      <!-- end card -->

    </td></tr>
  </table>

</body>
</html>"""

    text_body = (
        f"eSKala — Email Verification\n"
        f"City of Santa Rosa, Laguna · CYDO\n"
        f"{'=' * 48}\n\n"
        f"Good day, {display_name}.\n\n"
        f"You have initiated a citizen account registration on the eSKala SK\n"
        f"Transparency Portal of the City of Santa Rosa, Laguna.\n\n"
        f"Your One-Time Verification Code:\n\n"
        f"    {otp_spaced}\n\n"
        f"This code is valid for 5 minutes only.\n"
        f"Do NOT share this code with anyone.\n\n"
        f"If you did not initiate this request, disregard this message.\n"
        f"No account will be created without completing verification.\n\n"
        f"{'=' * 48}\n"
        f"eSKala — City Government of Santa Rosa, Laguna\n"
        f"This is a system-generated message. Do not reply.\n"
    )

    # 1. Try Brevo HTTP API if BREVO_API_KEY is configured (allows sending to ANY recipient email without custom domain verification)
    brevo_api_key = os.getenv("BREVO_API_KEY", "").strip()
    sender_email = os.getenv("SENDER_EMAIL", "jamesangelobolano@gmail.com").strip()

    if brevo_api_key:
        import httpx
        try:
            res = httpx.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={
                    "api-key": brevo_api_key,
                    "content-type": "application/json",
                    "accept": "application/json",
                },
                json={
                    "sender": {"name": "eSKala Portal", "email": sender_email},
                    "to": [{"email": to_email}],
                    "subject": f"[eSKala] Email Verification Code — {otp_code}",
                    "htmlContent": html_body,
                    "textContent": text_body,
                },
                timeout=12.0,
            )
            if res.status_code in (200, 201, 202):
                return
            raise RuntimeError(f"Brevo API error ({res.status_code}): {res.text}")
        except Exception as b_err:
            if not resend.api_key:
                raise RuntimeError(f"Failed to send email via Brevo: {b_err}")

    # 2. Try Resend API
    if not resend.api_key:
        raise RuntimeError(
            "Email service not configured. "
            "Set BREVO_API_KEY or RESEND_API_KEY in backend/.env."
        )

    try:
        params: resend.Emails.SendParams = {
            "from": SENDER_FROM,
            "to": [to_email],
            "subject": f"[eSKala] Email Verification Code — {otp_code}",
            "html": html_body,
            "text": text_body,
        }
        resend.Emails.send(params)
    except Exception as exc:
        err_msg = str(exc)
        if "only send testing emails to your own email address" in err_msg:
            raise RuntimeError(
                "Resend test mode limit: Resend's free 'onboarding@resend.dev' sender only permits sending to the account owner (jamesangelobolano@gmail.com). "
                "To send to any citizen email address, please add BREVO_API_KEY to .env (Brevo allows 300 free emails/day to any recipient)."
            ) from exc
        raise RuntimeError(f"Failed to send OTP email: {err_msg}") from exc

