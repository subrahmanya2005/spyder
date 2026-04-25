import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    await connectToDatabase();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ success: false, error: 'EMAIL_NOT_FOUND', message: 'Email not found.' }, { status: 404 });
    }

    // Lockout check
    if (user.otp_locked_until && user.otp_locked_until > new Date()) {
      const minutesLeft = Math.ceil((user.otp_locked_until - new Date()) / 60000);
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${minutesLeft} minute(s).` },
        { status: 429 }
      );
    }

    const otp      = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    user.otp          = otp;
    user.otpExpiry    = otpExpiry;
    user.otp_attempts = 0;
    await user.save();

    if (resend) {
      await resend.emails.send({
        from: 'SaveMate <no-reply@riverqueen.in>',
        to: email,
        subject: 'Your SaveMate Login OTP',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
            <h2 style="color:#3b82f6;">Login OTP</h2>
            <p>Hello ${user.name},</p>
            <p>Your one-time password is:</p>
            <div style="font-size:36px;font-weight:900;letter-spacing:10px;text-align:center;margin:24px 0;color:#0f172a;background:#f1f5f9;padding:20px;border-radius:10px;">
              ${otp}
            </div>
            <p style="color:#94a3b8;font-size:13px;">This OTP expires in 10 minutes. Do not share it with anyone.</p>
          </div>
        `,
      });
    } else {
      console.log(`[SIMULATED OTP to ${email}]: ${otp}`);
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent',
      simulatedOtp: !resend ? otp : null,
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
