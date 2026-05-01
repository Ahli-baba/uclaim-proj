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

const sendClaimApprovedEmail = async (to, name, itemTitle) => {
    const msg = {
        to,
        from: FROM_EMAIL,
        subject: `✅ Your claim for "${itemTitle}" has been approved — UClaim`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0;">UClaim</h1>
                    <p style="margin: 5px 0 0 0;">Lost & Found Management</p>
                </div>
                <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                    <h2 style="color: #111827;">Good news, ${name}! 🎉</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                        Your claim for <strong>"${itemTitle}"</strong> has been <strong style="color: #10b981;">approved</strong> by the admin.
                    </p>
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
                        <p style="margin: 0 0 8px 0; font-weight: bold; color: #065f46;">📍 Next Step — Visit the SAO Office</p>
                        <p style="margin: 0; color: #047857; font-size: 15px; line-height: 1.6;">
                            The finder will be dropping off your item at the <strong>Student Affairs Office (SAO)</strong>.
                            Once the item arrives, you will receive another notification to come and pick it up.
                            Please bring a <strong>valid school ID</strong> when you visit.
                        </p>
                    </div>
                    <p style="color: #6b7280; font-size: 14px;">
                        You can track your claim status anytime by logging into UClaim and visiting <strong>My Claims</strong>.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        This is an automated message from UClaim. Please do not reply to this email.
                    </p>
                </div>
            </div>
        `
    };
    try {
        await sgMail.send(msg);
        console.log(`✅ Claim approved email sent to ${to}`);
        return true;
    } catch (err) {
        console.error('❌ Claim approved email failed:', err.response?.body?.errors || err.message);
        return false;
    }
};

const sendClaimRejectedEmail = async (to, name, itemTitle, rejectionReason) => {
    const msg = {
        to,
        from: FROM_EMAIL,
        subject: `❌ Your claim for "${itemTitle}" was not approved — UClaim`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0;">UClaim</h1>
                    <p style="margin: 5px 0 0 0;">Lost & Found Management</p>
                </div>
                <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                    <h2 style="color: #111827;">Hi ${name},</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                        Unfortunately, your claim for <strong>"${itemTitle}"</strong> was <strong style="color: #ef4444;">not approved</strong>.
                    </p>
                    ${rejectionReason ? `
                    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 24px 0;">
                        <p style="margin: 0 0 6px 0; font-weight: bold; color: #991b1b;">Reason:</p>
                        <p style="margin: 0; color: #b91c1c; font-size: 15px;">${rejectionReason}</p>
                    </div>` : ""}
                    <p style="color: #4b5563; font-size: 15px; line-height: 1.5;">
                        If you believe this is a mistake or have additional proof of ownership, 
                        you may log in to UClaim and submit a new claim with more details.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        This is an automated message from UClaim. Please do not reply to this email.
                    </p>
                </div>
            </div>
        `
    };
    try {
        await sgMail.send(msg);
        console.log(`✅ Claim rejected email sent to ${to}`);
        return true;
    } catch (err) {
        console.error('❌ Claim rejected email failed:', err.response?.body?.errors || err.message);
        return false;
    }
};

const sendItemAtSAOEmail = async (to, name, itemTitle, saoNotes, pickupDeadline) => {
    const msg = {
        to,
        from: FROM_EMAIL,
        subject: `📍 Your item "${itemTitle}" is now at the SAO — Come pick it up!`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0;">UClaim</h1>
                    <p style="margin: 5px 0 0 0;">Lost & Found Management</p>
                </div>
                <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                    <h2 style="color: #111827;">Hi ${name}, your item is ready! 📦</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                        <strong>"${itemTitle}"</strong> has been dropped off at the 
                        <strong style="color: #2563eb;">Student Affairs Office (SAO)</strong> 
                        and is ready for pickup.
                    </p>
                    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 24px 0;">
                        <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e40af;">📍 What to do next:</p>
                        <ul style="margin: 0; padding-left: 20px; color: #1d4ed8; font-size: 15px; line-height: 1.8;">
                            <li>Go to the SAO Office</li>
                            <li>Bring a valid school ID</li>
                            <li>Claim your item at the counter</li>
                        </ul>
                        ${saoNotes ? `<p style="margin: 14px 0 0 0; color: #1e40af; font-size: 14px;">📌 Note: ${saoNotes}</p>` : ""}
                        ${pickupDeadline ? `<p style="margin: 10px 0 0 0; color: #dc2626; font-size: 14px; font-weight: bold;">⚠️ Pickup deadline: ${new Date(pickupDeadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>` : ""}
                    </div>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        This is an automated message from UClaim. Please do not reply to this email.
                    </p>
                </div>
            </div>
        `
    };
    try {
        await sgMail.send(msg);
        console.log(`✅ Item at SAO email sent to ${to}`);
        return true;
    } catch (err) {
        console.error('❌ Item at SAO email failed:', err.response?.body?.errors || err.message);
        return false;
    }
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendClaimApprovedEmail,
    sendClaimRejectedEmail,
    sendItemAtSAOEmail
};