const nodemailer = require("nodemailer");
const dns = require("dns");

// Custom DNS lookup that forces IPv4 resolution (forces family: 4)
function customLookup(hostname, options, callback) {
  return dns.lookup(hostname, { ...options, family: 4 }, callback);
}

/**
 * Create a transporter.
 * If EMAIL_HOST is set, use real SMTP. Otherwise, log to console (dev mode).
 */
function getTransporter() {
  if (process.env.EMAIL_SERVICE) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      lookup: customLookup, // Force IPv4 DNS resolution for this transport
    });
  }
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Prevents SMTP handshake failures on cloud servers
      },
      lookup: customLookup, // Force IPv4 DNS resolution for this transport
    });
  }
  return null; // no SMTP → will log to console
}

/**
 * Send an email. Falls back to console.log if no SMTP is configured.
 */
async function sendMail({ to, subject, html }) {
  const transporter = getTransporter();

  if (!transporter) {
    console.log("\n══════════════════════════════════════════════════");
    console.log("📧  EMAIL (dev mode — no SMTP configured)");
    console.log(`   To:      ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body:`);
    console.log(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    console.log("══════════════════════════════════════════════════\n");
    return;
  }

  const defaultFrom = process.env.EMAIL_USER ? `Polycom Innovation <${process.env.EMAIL_USER}>` : "noreply@polycom.com";

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || defaultFrom,
    to,
    subject,
    html,
  });

  console.log(`📧 Email sent successfully to: ${to}`);
}

/**
 * Send a 6-digit OTP for email verification.
 */
async function sendVerificationEmail(email, otp) {
  await sendMail({
    to: email,
    subject: "Polycom — Verify Your Email",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0a0a0a;padding:32px;border:1px solid #1e1e1e;">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#fff;margin:0;">Polycom Innovation</h2>
          <p style="color:#888;font-size:13px;margin:4px 0 0;">Email Verification</p>
        </div>
        <div style="background:#111;border:1px solid #1e1e1e;padding:24px;text-align:center;">
          <p style="color:#ccc;font-size:14px;margin:0 0 16px;">Your verification code is:</p>
          <div style="font-size:36px;font-weight:900;color:#E8001C;letter-spacing:8px;margin:0 0 16px;">${otp}</div>
          <p style="color:#666;font-size:12px;margin:0;">This code expires in <strong>10 minutes</strong>.</p>
        </div>
        <p style="color:#444;font-size:11px;text-align:center;margin-top:20px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

/**
 * Send a password-reset link.
 */
async function sendPasswordResetEmail(email, resetToken) {
  const link = `${process.env.FRONTEND_URL || "https://polycom-checklist.netlify.app"}/reset-password?token=${resetToken}`;
  await sendMail({
    to: email,
    subject: "Polycom — Reset Your Password",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0a0a0a;padding:32px;border:1px solid #1e1e1e;">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#fff;margin:0;">Polycom Innovation</h2>
          <p style="color:#888;font-size:13px;margin:4px 0 0;">Password Reset</p>
        </div>
        <div style="background:#111;border:1px solid #1e1e1e;padding:24px;text-align:center;">
          <p style="color:#ccc;font-size:14px;margin:0 0 20px;">Click the button below to reset your password:</p>
          <a href="${link}" style="display:inline-block;background:#E8001C;color:#fff;text-decoration:none;padding:14px 36px;font-size:14px;font-weight:700;letter-spacing:0.5px;">
            Reset Password
          </a>
          <p style="color:#666;font-size:12px;margin:20px 0 0;">This link expires in <strong>1 hour</strong>.</p>
        </div>
        <p style="color:#444;font-size:11px;text-align:center;margin-top:20px;">If you didn't request this, you can safely ignore this email.</p>
        <p style="color:#333;font-size:10px;text-align:center;margin-top:8px;word-break:break-all;">Link: ${link}</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
