import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { getSessionUser } from '@/lib/auth';

export async function POST(req) {
  try {
    const session = getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { current_password, new_password } = await req.json();

    if (!current_password || !new_password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (new_password.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(session.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (!user.password) {
      return NextResponse.json(
        { error: 'This account uses OTP login and has no password set.' },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    user.password = await bcrypt.hash(new_password, 12);
    await user.save();

    return NextResponse.json({ success: true, message: 'Password changed successfully' });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
