import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Account from '@/models/Account';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import Goal from '@/models/Goal';
import { getSessionUser } from '@/lib/auth';
import { Resend } from 'resend';
import { validateAmount } from '@/lib/validateAmount';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const session = getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount, otp, source_type, goal_id } = await req.json();
    const amtCheck = validateAmount(amount);
    if (!amtCheck.valid) return NextResponse.json({ error: 'INVALID_AMOUNT', message: amtCheck.error }, { status: 400 });
    if (!otp) return NextResponse.json({ error: 'OTP is required' }, { status: 400 });

    await connectToDatabase();

    const user_id = session.userId;
    const user    = await User.findById(user_id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    user.otp       = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const account = await Account.findOne({ user_id });
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    if (source_type === 'goal') {
      if (!goal_id) return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
      const goal = await Goal.findById(goal_id);
      if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
      if ((goal.saved_amount || 0) < amount) {
        return NextResponse.json({ error: 'Insufficient goal balance' }, { status: 400 });
      }
      goal.saved_amount -= amount;
      await goal.save();
      account.main_balance += amount;
      await account.save();
      await Transaction.create({ user_id, type: 'withdraw', amount, source: 'goal' });
    } else {
      if (account.savings_wallet < amount) {
        return NextResponse.json({ error: 'Insufficient basic savings balance' }, { status: 400 });
      }
      account.savings_wallet -= amount;
      account.main_balance   += amount;
      await account.save();
      await Transaction.create({ user_id, type: 'withdraw', amount, source: 'wallet' });
    }

    const remainingBalance = source_type === 'goal' 
      ? (await Goal.findById(goal_id)).saved_amount 
      : account.savings_wallet;

    if (process.env.RESEND_API_KEY && user.email) {
      console.log('Attempting to send emergency withdrawal email to:', user.email);
      resend.emails.send({
               from: 'SaveMate <no-reply@riverqueen.in>',

        to: user.email,
        subject: '⚠️ Emergency Withdrawal Alert',
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
            <h2 style="color: #ef4444; margin-bottom: 20px;">Emergency Withdrawal Alert</h2>
            <p style="font-size: 16px; color: #333;">Hello,</p>
            <p style="font-size: 16px; color: #333;">This is a confirmation that an emergency withdrawal was successfully processed on your SaveMate account.</p>
            <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;">
              <p style="margin: 5px 0;"><strong>Amount Withdrawn:</strong> ₹${amount.toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${new Date().toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>Remaining Balance (${source_type === 'goal' ? 'Goal' : 'Savings'}):</strong> ₹${remainingBalance.toLocaleString()}</p>
            </div>
            <p style="font-size: 14px; color: #666; border-left: 4px solid #ef4444; padding-left: 10px;">
              <strong>Warning:</strong> Frequent emergency withdrawals can impact your long-term savings goals. 
              If you did not authorize this action, please contact support immediately.
            </p>
            <p style="font-size: 14px; color: #999; margin-top: 30px;">Stay secure,<br>The SaveMate Team</p>
          </div>
        `
      }).then((data) => {
        console.log('Email sent successfully via Resend:', data);
      }).catch(err => {
        console.error('Failed to send email via Resend:', err);
      });
    } else {
      console.log('Resend not triggered. API_KEY present:', !!process.env.RESEND_API_KEY, 'User Email:', user.email);
    }

    return NextResponse.json({ success: true, message: 'Withdrawal successful' });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
