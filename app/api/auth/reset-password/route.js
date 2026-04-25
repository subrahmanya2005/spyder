import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    await connectToDatabase();

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      password_reset_token:  hashedToken,
      password_reset_expiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset link. Please request a new one.' }, { status: 400 });
    }

    user.password              = await bcrypt.hash(password, 12);
    user.password_reset_token  = undefined;
    user.password_reset_expiry = undefined;
    await user.save();

    return NextResponse.json({ success: true, message: 'Password reset successfully. You can now login.' });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
