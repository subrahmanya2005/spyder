import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Account from '@/models/Account';
import Transaction from '@/models/Transaction';
import { getSessionUser } from '@/lib/auth';

export async function POST(req) {
  try {
    const session = getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount, otp } = await req.json();
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

    if (otp !== '1234') {
      return NextResponse.json({ error: 'Invalid OTP. Use 1234.' }, { status: 400 });
    }

    await connectToDatabase();

    const user_id = session.userId;
    const account = await Account.findOne({ user_id });
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    if (account.investment_balance < amount) {
      return NextResponse.json({ error: 'Insufficient investment balance' }, { status: 400 });
    }

    account.investment_balance -= amount;
    account.main_balance       += amount;
    await account.save();

    await Transaction.create({ user_id, type: 'withdraw', amount, source: 'investment' });

    return NextResponse.json({ success: true, message: 'Investment withdrawal successful' });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
