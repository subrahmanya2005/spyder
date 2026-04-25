import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    await connectToDatabase();

    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true, message: 'If an account exists, a reset email has been sent.' });
    }

    const rawToken   = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.password_reset_token  = hashedToken;
    user.password_reset_expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save();

    const resetUrl = `${APP_URL}/reset-password/${rawToken}`;

    if (resend) {
      await resend.emails.send({
        from: 'SaveMate <no-reply@riverqueen.in>',
        to: email,
        subject: 'Reset your SaveMate password',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
            <h2 style="color:#3b82f6;">Password Reset</h2>
            <p>Hello ${user.name},</p>
            <p>Click the button below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
            <a href="${resetUrl}" style="display:inline-block;margin:24px 0;background:#3b82f6;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;">Reset Password</a>
            <p style="color:#94a3b8;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } else {
      console.log(`[SIMULATED RESET EMAIL] URL: ${resetUrl}`);
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists, a reset email has been sent.',
      simulatedUrl: !resend ? resetUrl : undefined,
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
