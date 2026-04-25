import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Portfolio from '@/models/Portfolio';
import Account from '@/models/Account';
import { getSessionUser } from '@/lib/auth';

export async function POST(req) {
  try {
    const session = getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const user_id  = session.userId;
    const portfolios = await Portfolio.find({ user_id });

    if (portfolios.length === 0) {
      return NextResponse.json({ success: true, portfolios: [], total_value: 0 });
    }

    let newTotal = 0;

    for (const portfolio of portfolios) {
      let multiplier = 1.0;
      if (portfolio.risk_level === 'Low') {
        multiplier = 1 + (Math.random() * 0.003 - 0.001);
      } else if (portfolio.risk_level === 'Medium') {
        multiplier = 1 + (Math.random() * 0.025 - 0.010);
      } else {
        multiplier = 1 + (Math.random() * 0.110 - 0.050);
      }
      portfolio.current_value = Number((portfolio.current_value * multiplier).toFixed(2));
      portfolio.last_updated  = new Date();
      await portfolio.save();
      newTotal += portfolio.current_value;
    }

    const account = await Account.findOne({ user_id });
    if (account) {
      account.investment_balance = Number(newTotal.toFixed(2));
      await account.save();
    }

    return NextResponse.json({ success: true, portfolios, total_value: newTotal });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
