import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Account from '@/models/Account';
import Transaction from '@/models/Transaction';
import { getSessionUser } from '@/lib/auth';

export async function POST(req) {
  try {
    const session = getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount } = await req.json();
    if (amount === undefined || amount < 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    await connectToDatabase();

    const user_id = session.userId;
    const account = await Account.findOne({ user_id });
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    account.cash_savings = amount;
    await account.save();

    await Transaction.create({ user_id, type: 'save', amount, source: 'cash' });

    return NextResponse.json({ success: true, message: `Cash balance updated to ₹${amount}` });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
