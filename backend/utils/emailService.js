const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY || 'SG.your-key-here');

const FROM_EMAIL = process.env.FROM_EMAIL || 'uclaimsupport@gmail.com';

const sendVerificationEmail = async (to, token, name) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    const msg = {
        to: to,
        from: FROM_EMAIL,
        subject: 'Verify your UClaim account',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0;">UClaim</h1>
                    <p style="margin: 5px 0 0 0;">Lost & Found Management</p>
                </div>
                <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                    <h2 style="color: #111827;">Welcome, ${name}!</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                        Please verify your email address to complete your registration and start using UClaim.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="background: #4f46e5; color: white; padding: 14px 28px; 
                                  text-decoration: none; border-radius: 6px; display: inline-block;
                                  font-weight: bold; font-size: 16px;">
                            Verify Email Address
                        </a>
                    </div>
                    <p style="color: #6b7280; font-size: 14px;">
                        Or copy and paste this link:<br>
                        <a href="${verificationUrl}" style="color: #4f46e5; word-break: break-all;">
                            ${verificationUrl}
                        </a>
                    </p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.
                    </p>
                </div>
            </div>
        `
    };

    try {
        await sgMail.send(msg);
        console.log(`✅ Verification email sent to ${to}`);
        return true;
    } catch (err) {
        console.error('❌ Email send failed:', err.response?.body?.errors || err.message);
        return false;
    }
};

const sendPasswordResetEmail = async (to, token, name) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    const msg = {
        to: to,
        from: FROM_EMAIL,
        subject: 'Reset your UClaim password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0;">Password Reset Request</h1>
                </div>
                <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                    <h2 style="color: #111827;">Hi ${name},</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                        We received a request to reset your password. Click the button below to set a new password.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background: #ef4444; color: white; padding: 14px 28px; 
                                  text-decoration: none; border-radius: 6px; display: inline-block;
                                  font-weight: bold; font-size: 16px;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #6b7280; font-size: 14px;">
                        This link expires in 1 hour. If you didn't request this, please ignore this email.
                    </p>
                </div>
            </div>
        `
    };

    try {
        await sgMail.send(msg);
        console.log(`✅ Password reset email sent to ${to}`);
        return true;
    } catch (err) {
        console.error('❌ Email send failed:', err.response?.body?.errors || err.message);
        return false;
    }
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
};