"""
Email utility — send transactional emails (password reset, verification).
Uses aiosmtplib for async SMTP.
"""

import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings


async def _send_email(to_email: str, subject: str, html_body: str) -> None:
    """Send an HTML email via SMTP (async)."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        # In development, just print the email content instead of sending
        print(f"\n📧 [DEV EMAIL] To: {to_email}")
        print(f"   Subject: {subject}")
        print(f"   Body: {html_body[:200]}...\n")
        return

    message = MIMEMultipart("alternative")
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
    message["To"] = to_email
    message["Subject"] = subject
    message.attach(MIMEText(html_body, "html"))

    await aiosmtplib.send(
        message,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        start_tls=True,
    )


async def send_password_reset_email(to_email: str, full_name: str, reset_token: str) -> None:
    """Send a password reset link to the user."""
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">Healthcare Navigator — Password Reset</h2>
        <p>Hello {full_name},</p>
        <p>We received a request to reset your password. Click the button below to proceed:</p>
        <a href="{reset_url}" style="
            display: inline-block; padding: 12px 24px;
            background-color: #0ea5e9; color: white;
            border-radius: 8px; text-decoration: none; font-weight: bold;
        ">Reset Password</a>
        <p style="color: #666; margin-top: 20px;">
            This link expires in 1 hour. If you did not request a password reset, ignore this email.
        </p>
    </div>
    """
    await _send_email(to_email, "Reset Your Healthcare Navigator Password", html)


async def send_verification_email(to_email: str, full_name: str, verify_token: str) -> None:
    """Send an email verification link to the user."""
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={verify_token}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">Verify Your Email Address</h2>
        <p>Hello {full_name},</p>
        <p>Please verify your email address to activate your Healthcare Navigator account:</p>
        <a href="{verify_url}" style="
            display: inline-block; padding: 12px 24px;
            background-color: #0ea5e9; color: white;
            border-radius: 8px; text-decoration: none; font-weight: bold;
        ">Verify Email</a>
    </div>
    """
    await _send_email(to_email, "Verify Your Healthcare Navigator Email", html)
