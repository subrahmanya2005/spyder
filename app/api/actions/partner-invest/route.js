import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Account from '@/models/Account';
import Transaction from '@/models/Transaction';
import Portfolio from '@/models/Portfolio';
import { getSessionUser } from '@/lib/auth';

export async function POST(req) {
  try {
    const session = getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount, risk_level } = await req.json();
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

    await connectToDatabase();

    const user_id = session.userId;
    const account = await Account.findOne({ user_id });
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    if (account.main_balance < amount) {
      return NextResponse.json({ error: 'Insufficient SaveMate spendable balance' }, { status: 400 });
    }

    account.main_balance       -= amount;
    account.investment_balance += amount;
    await account.save();

    let portfolio = await Portfolio.findOne({ user_id, risk_level });
    if (portfolio) {
      portfolio.principal    += amount;
      portfolio.current_value += amount;
      await portfolio.save();
    } else {
      await Portfolio.create({ user_id, risk_level, principal: amount, current_value: amount });
    }

    await Transaction.create({ user_id, type: 'invest', amount, source: 'partner_api' });

    return NextResponse.json({
      success: true,
      message: `Successfully invested ₹${amount} into ${risk_level} Risk Portfolio via SaveMate!`,
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
