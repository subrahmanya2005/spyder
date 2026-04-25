import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Account from '@/models/Account';
import Transaction from '@/models/Transaction';
import { getSessionUser } from '@/lib/auth';

export async function POST(req) {
  try {
    const session = getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount, plan } = await req.json();
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

    await connectToDatabase();

    const user_id = session.userId;
    const account = await Account.findOne({ user_id });
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    if (account.savings_wallet < amount) {
      return NextResponse.json({ error: 'Insufficient savings wallet balance' }, { status: 400 });
    }

    account.savings_wallet     -= amount;
    const initial_return        = plan === 'Growth' ? 1.02 : 1.01;
    account.investment_balance += amount * initial_return;
    await account.save();

    await Transaction.create({ user_id, type: 'invest', amount, source: 'investment' });

    return NextResponse.json({ success: true, message: `Invested ₹${amount} into ${plan} plan` });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
