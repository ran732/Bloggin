import logging
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def send_welcome_email(user):
    """
    Sends a sleek, welcome email to newly registered authors/readers.
    """
    subject = "Welcome to Bloggin — Stories, Ideas & Perspectives"
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "Bloggin Platform <no-reply@bloggin.local>")
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")

    text_content = (
        f"Hi {user.username},\n\n"
        f"Welcome to Bloggin! We're thrilled to have you in our community.\n\n"
        f"Here are a few things you can do to get started:\n"
        f"1. Explore stories: {frontend_url}/explore\n"
        f"2. Write your first article: {frontend_url}/write\n"
        f"3. Build your Reading List: Bookmark any article with the ribbon icon.\n\n"
        f"Happy writing and reading,\n"
        f"The Bloggin Team"
    )

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
        .card {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 36px 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
        .brand {{ font-size: 24px; font-weight: 800; color: #6366f1; letter-spacing: -0.5px; margin-bottom: 24px; }}
        h1 {{ font-size: 22px; color: #0f172a; margin-top: 0; margin-bottom: 12px; }}
        p {{ font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 16px; }}
        .feature-box {{ background: #f1f5f9; border-radius: 10px; padding: 18px 20px; margin: 20px 0; }}
        .feature-item {{ margin-bottom: 10px; font-size: 14px; color: #334155; }}
        .btn {{ display: inline-block; background-color: #6366f1; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin-top: 12px; }}
        .footer {{ font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">✍ Bloggin</div>
        <h1>Welcome, {user.username}!</h1>
        <p>Thank you for joining Bloggin. Your author and reader account is now active and ready.</p>
        
        <div class="feature-box">
          <div class="feature-item">📖 <strong>Discover:</strong> Explore trending technical stories, career guides, and tutorials.</div>
          <div class="feature-item">✍️ <strong>Publish:</strong> Write and share your perspectives with our fast Markdown-supported editor.</div>
          <div class="feature-item">🔖 <strong>Reading List:</strong> Bookmark stories to read anytime on your personal dashboard.</div>
          <div class="feature-item">👥 <strong>Follow:</strong> Connect with your favorite authors and personalize your feed.</div>
        </div>

        <a href="{frontend_url}/explore" class="btn">Start Exploring Stories →</a>

        <div class="footer">
          You received this email because you registered on Bloggin.<br>
          If you did not sign up, please ignore this email.
        </div>
      </div>
    </body>
    </html>
    """

    try:
        send_mail(
            subject=subject,
            message=text_content,
            from_email=from_email,
            recipient_list=[user.email] if user.email else [],
            html_message=html_content,
            fail_silently=False,
        )
        logger.info(f"Welcome email successfully sent to {user.username} ({user.email})")
        return True
    except Exception as e:
        logger.warning(f"Failed to send welcome email to {user.email}: {e}")
        return False


def send_password_reset_email(user, reset_url):
    """
    Sends a secure password reset link to user's registered email.
    """
    subject = "Reset your Bloggin account password"
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "Bloggin Platform <no-reply@bloggin.local>")

    text_content = (
        f"Hi {user.username},\n\n"
        f"We received a request to reset your Bloggin account password.\n\n"
        f"Please click the link below to set a new password:\n"
        f"{reset_url}\n\n"
        f"This link will expire in 24 hours.\n"
        f"If you did not request a password reset, you can safely disregard this email.\n\n"
        f"The Bloggin Team"
    )

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
        .card {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 36px 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
        .brand {{ font-size: 24px; font-weight: 800; color: #6366f1; letter-spacing: -0.5px; margin-bottom: 24px; }}
        h1 {{ font-size: 22px; color: #0f172a; margin-top: 0; margin-bottom: 12px; }}
        p {{ font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 16px; }}
        .btn {{ display: inline-block; background-color: #6366f1; color: #ffffff !important; padding: 13px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 16px 0; }}
        .alert-note {{ font-size: 13px; color: #64748b; background: #f8fafc; border-left: 3px solid #6366f1; padding: 10px 14px; border-radius: 4px; margin-top: 16px; }}
        .footer {{ font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">✍ Bloggin</div>
        <h1>Password Reset Request</h1>
        <p>Hi {user.username},</p>
        <p>We received a request to reset the password for your Bloggin account. Click the button below to choose a new password:</p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="{reset_url}" class="btn">Reset Password →</a>
        </div>

        <p style="font-size: 13px; word-break: break-all; color: #64748b;">
          Or copy and paste this link into your browser:<br>
          <a href="{reset_url}" style="color: #6366f1;">{reset_url}</a>
        </p>

        <div class="alert-note">
          🔒 For your security, this password reset link will expire in 24 hours and can only be used once.
        </div>

        <div class="footer">
          If you did not request this password change, no action is needed — your account remains secure.<br>
          © Bloggin Platform.
        </div>
      </div>
    </body>
    </html>
    """

    try:
        send_mail(
            subject=subject,
            message=text_content,
            from_email=from_email,
            recipient_list=[user.email],
            html_message=html_content,
            fail_silently=False,
        )
        logger.info(f"Password reset email sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset email to {user.email}: {e}")
        return False


def send_new_follower_email(follower, followed_user):
    """
    Notifies an author when another user follows them.
    """
    if not followed_user.email:
        return False

    subject = f"{follower.username} started following you on Bloggin"
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "Bloggin Platform <no-reply@bloggin.local>")
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    profile_url = f"{frontend_url}/author/{follower.username}"

    text_content = (
        f"Hi {followed_user.username},\n\n"
        f"{follower.username} just started following your stories on Bloggin!\n\n"
        f"View their profile: {profile_url}\n\n"
        f"Keep sharing great stories,\n"
        f"The Bloggin Team"
    )

    try:
        send_mail(
            subject=subject,
            message=text_content,
            from_email=from_email,
            recipient_list=[followed_user.email],
            fail_silently=True,
        )
        return True
    except Exception:
        return False
