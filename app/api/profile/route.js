import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Account from '@/models/Account';
import Goal from '@/models/Goal';
import Transaction from '@/models/Transaction';
import Portfolio from '@/models/Portfolio';
import { getSessionUser } from '@/lib/auth';

const SAFE_SELECT = '-password -otp -otpExpiry -password_reset_token -password_reset_expiry -otp_attempts -otp_locked_until';

export async function GET(req) {
  try {
    const session = getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const user = await User.findById(session.userId).select(SAFE_SELECT);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user }, { headers: { 'Cache-Control': 'no-store' } });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    const allowed = [
      'name', 'gender', 'phone',
      'address', 'pincode',
      'occupation', 'average_income', 'current_salary', 'days_of_work',
      'bank_name', 'bank_account_number', 'bank_ifsc',
      'aadhaar_number', 'pan_photo_url', 'profile_photo_url',
    ];

    const update = {};
    for (const field of allowed) {
      if (body[field] !== undefined) update[field] = body[field];
    }

    await connectToDatabase();

    const existing = await User.findById(session.userId).select('name phone address pincode occupation bank_name bank_account_number bank_ifsc aadhaar_number');
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const merged = { ...existing.toObject(), ...update };
    const complete = !!(
      merged.name && merged.phone && merged.address && merged.pincode &&
      merged.occupation && merged.bank_name && merged.bank_account_number &&
      merged.bank_ifsc && merged.aadhaar_number
    );
    update.is_profile_complete = complete;

    const user = await User.findByIdAndUpdate(
      session.userId,
      { $set: update },
      { new: true, runValidators: true }
    ).select(SAFE_SELECT);

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, user });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const uid = session.userId;

    await Promise.all([
      User.findByIdAndDelete(uid),
      Account.findOneAndDelete({ user_id: uid }),
      Goal.deleteMany({ user_id: uid }),
      Transaction.deleteMany({ user_id: uid }),
      Portfolio.deleteMany({ user_id: uid }),
    ]);

    const response = NextResponse.json({ success: true, message: 'Account permanently deleted' });
    response.cookies.set('auth_token', '', { expires: new Date(0), path: '/' });
    return response;

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
