import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Goal from '@/models/Goal';
import Account from '@/models/Account';
import Transaction from '@/models/Transaction';
import { getSessionUser } from '@/lib/auth';

export async function POST(req) {
  try {
    const session = getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { goal_id, otp } = await req.json();
    if (!goal_id || !otp) {
      return NextResponse.json({ error: 'Goal ID and OTP are required' }, { status: 400 });
    }

    await connectToDatabase();

    // Validate OTP
    const user = await User.findById(session.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    // Clear OTP immediately
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Validate goal ownership and completion
    const goal = await Goal.findById(goal_id);
    if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

    if (goal.user_id.toString() !== session.userId) {
      return NextResponse.json({ error: 'Only the goal owner can claim this goal' }, { status: 403 });
    }

    const claimAmount = goal.saved_amount || 0;
    if (claimAmount < goal.target_amount) {
      return NextResponse.json({ error: 'Goal is not yet complete' }, { status: 400 });
    }

    // Transfer: goal → main wallet
    const account = await Account.findOne({ user_id: session.userId });
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    account.main_balance += claimAmount;
    await account.save();

    // Mark goal as claimed: reset saved_amount and zero contributions
    goal.saved_amount = 0;
    goal.contributions = goal.contributions.map(c => ({ ...c, amount: 0 }));
    await goal.save();

    // Record transaction
    await Transaction.create({
      user_id: session.userId,
      type: 'withdraw',
      amount: claimAmount,
      source: 'goal'
    });

    // Notify collaborators via socket if available
    if (global.io) {
      const notify = new Set([session.userId]);
      goal.shared_with?.forEach(id => notify.add(id.toString()));
      notify.forEach(uid => global.io.to(`user_${uid}`).emit('data_updated'));
    }

    return NextResponse.json({
      success: true,
      message: `₹${claimAmount.toLocaleString('en-IN')} claimed successfully!`,
      claimed_amount: claimAmount,
      new_main_balance: account.main_balance
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
