import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { Resend } from 'resend';
import { getSessionUser } from '@/lib/auth';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req) {
  try {
    const session = getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const user = await User.findById(session.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const otp      = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp       = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    if (resend) {
      await resend.emails.send({
        from: 'SaveMate <no-reply@riverqueen.in>',
        to: user.email,
        subject: 'Security Alert: SaveMate Emergency Withdrawal OTP',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:#ef4444;color:white;padding:20px;text-align:center;">
              <h2 style="margin:0;">Emergency Withdrawal Request</h2>
            </div>
            <div style="padding:30px;">
              <p>Hello ${user.name},</p>
              <p>Your one-time withdrawal authorisation code is:</p>
              <div style="text-align:center;margin:24px 0;">
                <span style="font-size:36px;font-weight:900;letter-spacing:10px;background:#f1f5f9;padding:15px 30px;border-radius:8px;color:#0f172a;">
                  ${otp}
                </span>
              </div>
              <p style="color:#64748b;font-size:13px;">Expires in 10 minutes. Do not share this code.</p>
              <p style="color:#ef4444;font-size:13px;font-weight:bold;">If you did not request this, please ignore this email.</p>
            </div>
          </div>
        `,
      });
    } else {
      console.log(`[SIMULATED TRANSACTION OTP to ${user.email}]: ${otp}`);
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your registered email',
      simulatedOtp: !resend ? otp : null,
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
