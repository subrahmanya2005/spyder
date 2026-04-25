import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { createToken, setAuthCookie } from '@/lib/auth';

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 min

export async function POST(req) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Lockout check
    if (user.otp_locked_until && user.otp_locked_until > new Date()) {
      const minutesLeft = Math.ceil((user.otp_locked_until - new Date()) / 60000);
      return NextResponse.json(
        { error: `Account locked. Try again in ${minutesLeft} minute(s).` },
        { status: 429 }
      );
    }

    // Expiry check
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    // Wrong OTP
    if (user.otp !== otp) {
      user.otp_attempts = (user.otp_attempts || 0) + 1;

      if (user.otp_attempts >= MAX_ATTEMPTS) {
        user.otp_locked_until = new Date(Date.now() + LOCK_DURATION_MS);
        user.otp       = undefined;
        user.otpExpiry = undefined;
        await user.save();
        return NextResponse.json(
          { error: 'Too many failed attempts. Account locked for 30 minutes.' },
          { status: 429 }
        );
      }

      await user.save();
      const remaining = MAX_ATTEMPTS - user.otp_attempts;
      return NextResponse.json(
        { error: `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` },
        { status: 400 }
      );
    }

    // Success — clear OTP state
    user.otp             = undefined;
    user.otpExpiry       = undefined;
    user.otp_attempts    = 0;
    user.otp_locked_until = undefined;
    await user.save();

    const token = createToken(user._id);
    const response = NextResponse.json({ success: true, message: 'Login successful' });
    return setAuthCookie(response, token);

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
