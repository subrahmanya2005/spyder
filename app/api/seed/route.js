import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Account from '@/models/Account';
import Goal from '@/models/Goal';

export async function POST() {
  try {
    await connectToDatabase();

    // Check if user already exists
    let user = await User.findOne({ phone: "1234567890" });
    if (!user) {
      user = await User.create({ name: "Demo User", phone: "1234567890" });
      
      await Account.create({
        user_id: user._id,
        main_balance: 5000,
        savings_wallet: 1000,
        cash_savings: 500,
        investment_balance: 0,
      });

      await Goal.create({
        user_id: user._id,
        name: "Bike",
        target_amount: 50000,
        duration_days: 180, // 6 months
      });
    }

    return NextResponse.json({ success: true, message: "Database seeded successfully!", user_id: user._id });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
