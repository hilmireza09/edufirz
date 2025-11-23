# EduFirz Email Templates

Since Supabase email templates are managed in the Supabase Dashboard, you will need to copy and paste the HTML code below into your project settings.

**Go to:** Supabase Dashboard -> Authentication -> Email Templates

---

## 1. Signup Confirmation (Confirm your signup)

**Subject:** `Welcome to EduFirz – Let’s Begin Your Learning Journey!`

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to EduFirz</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #ffffff); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .content { padding: 40px 32px; color: #334155; line-height: 1.6; }
    .greeting { font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 16px; }
    .button-container { text-align: center; margin: 32px 0; }
    .button { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); transition: transform 0.2s; }
    .footer { background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
    .link-text { color: #6366f1; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="font-family: 'Segoe UI', 'Roboto', sans-serif; font-weight: 700; font-size: 40px; margin: 0;">
  <span style="color: #0056b3;">Edu</span><span style="color: #333333;">Firz</span>
</h1>

    </div>
    <div class="content">
      <div class="greeting">Welcome to the community!</div>
      <p>We are thrilled to have you join EduFirz. You are just one step away from accessing a world of knowledge, interactive quizzes, and collaborative learning.</p>
      <p>Please verify your email address to activate your account and begin your journey.</p>
      
      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">Verify My Account</a>
      </div>
      
      <p style="font-size: 14px; color: #94a3b8; margin-top: 32px;">If the button above doesn't work, copy and paste this link into your browser:<br>
      <a href="{{ .ConfirmationURL }}" class="link-text">{{ .ConfirmationURL }}</a></p>
    </div>
    <div class="footer">
      <p>&copy; 2025 EduFirz. All rights reserved.</p>
      <p>Empowering Education Everywhere.</p>
    </div>
  </div>
</body>
</html>
```

---

## 2. Reset Password (Reset password)

**Subject:** `Reset Your EduFirz Password`

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05); }
    .header { background-color: #ffffff; padding: 32px; text-align: center; border-bottom: 1px solid #f1f5f9; }
    .header h1 { color: #6366f1; margin: 0; font-size: 26px; font-weight: 700; }
    .content { padding: 40px 32px; color: #334155; line-height: 1.6; }
    .greeting { font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 16px; }
    .button-container { text-align: center; margin: 32px 0; }
    .button { background-color: #1e293b; color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(30, 41, 59, 0.2); }
    .footer { background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
    .link-text { color: #6366f1; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="font-family: 'Segoe UI', 'Roboto', sans-serif; font-weight: 700; font-size: 40px; margin: 0;">
  <span style="color: #0056b3;">Edu</span><span style="color: #333333;">Firz</span>
</h1>

    </div>
    <div class="content">
      <div class="greeting">Password Reset Request</div>
      <p>We received a request to reset the password for your EduFirz account. Don't worry, it happens to the best of us.</p>
      <p>Click the button below to securely choose a new password.</p>
      
      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
      </div>
      
      <p style="font-size: 14px; color: #64748b; margin-top: 24px; font-style: italic;">If you didn't request this change, you can safely ignore this email. Your password will remain unchanged.</p>
      
      <p style="font-size: 14px; color: #94a3b8; margin-top: 32px;">If the button above doesn't work, copy and paste this link into your browser:<br>
      <a href="{{ .ConfirmationURL }}" class="link-text">{{ .ConfirmationURL }}</a></p>
    </div>
    <div class="footer">
      <p>&copy; 2025 EduFirz. All rights reserved.</p>
      <p>Secure Account Management</p>
    </div>
  </div>
</body>
</html>
```
