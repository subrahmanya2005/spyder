import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Account from '@/models/Account';
import Transaction from '@/models/Transaction';
import { getSessionUser } from '@/lib/auth';

export async function POST(req) {
  try {
    const session = getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const user_id = session.userId;
    const account = await Account.findOne({ user_id });
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    account.main_balance       = 0;
    account.savings_wallet     = 0;
    account.cash_savings       = 0;
    account.investment_balance = 0;
    await account.save();

    await Transaction.create({ user_id, type: 'withdraw', amount: 0, source: 'external' });

    return NextResponse.json({ success: true, message: 'All balances reset to zero!' });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
