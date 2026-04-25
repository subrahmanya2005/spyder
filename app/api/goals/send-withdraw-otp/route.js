import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Goal from '@/models/Goal';
import { getSessionUser } from '@/lib/auth';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const session = getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { goal_id } = await req.json();
    if (!goal_id) return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });

    await connectToDatabase();

    const goal = await Goal.findById(goal_id);
    if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

    // Only owner can withdraw
    if (goal.user_id.toString() !== session.userId) {
      return NextResponse.json({ error: 'Only the goal owner can claim this goal' }, { status: 403 });
    }

    // Must be 100% complete
    if ((goal.saved_amount || 0) < goal.target_amount) {
      return NextResponse.json({ error: 'Goal is not yet complete' }, { status: 400 });
    }

    const user = await User.findById(session.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send celebratory email via Resend
    if (process.env.RESEND_API_KEY && user.email) {
      resend.emails.send({
              from: 'SaveMate <no-reply@riverqueen.in>',

        to: user.email,
        subject: `🎉 Goal Complete! Your withdrawal OTP for "${goal.name}"`,
        html: `
          <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0B0B0B; border-radius: 24px; overflow: hidden; border: 1px solid rgba(30,215,96,0.2);">
            <div style="background: linear-gradient(135deg, #0D1F12 0%, #0B0B0B 100%); padding: 40px; text-align: center; border-bottom: 1px solid rgba(30,215,96,0.15);">
              <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
              <div style="color: #1ED760; font-size: 22px; font-weight: 900; letter-spacing: -1px;">You did it, ${user.name}!</div>
              <p style="color: #555; font-size: 13px; margin: 6px 0 0; letter-spacing: 2px; text-transform: uppercase;">Goal Achieved · SaveMate</p>
            </div>

            <div style="padding: 36px 40px;">
              <div style="background: rgba(30,215,96,0.06); border: 1px solid rgba(30,215,96,0.2); border-radius: 20px; padding: 20px 24px; margin-bottom: 28px; text-align: center;">
                <p style="color: #555; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 6px;">Goal Completed</p>
                <p style="color: #1ED760; font-size: 22px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">${goal.name}</p>
                <p style="color: #888; font-size: 14px; margin: 4px 0 0;">₹${goal.saved_amount.toLocaleString('en-IN')} saved</p>
              </div>

              <p style="color: #888; font-size: 14px; margin: 0 0 20px; line-height: 1.6; text-align: center;">
                Use this OTP to claim your savings and transfer them to your main wallet.
              </p>

              <div style="background: #121212; border: 2px solid #1ED760; border-radius: 20px; padding: 28px; text-align: center; margin-bottom: 24px; box-shadow: 0 0 30px rgba(30,215,96,0.15);">
                <p style="color: #555; font-size: 10px; letter-spacing: 4px; text-transform: uppercase; margin: 0 0 12px;">Your Claim OTP</p>
                <div style="color: #1ED760; font-size: 48px; font-weight: 900; letter-spacing: 16px; font-family: monospace;">${otp}</div>
                <p style="color: #444; font-size: 11px; margin: 12px 0 0;">Expires in 5 minutes</p>
              </div>

              <p style="color: #333; font-size: 12px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; margin: 0;">
                If you didn't request this, you can safely ignore this email.<br/>
                SaveMate · savemet1234@gmail.com
              </p>
            </div>
          </div>
        `
      }).catch(err => console.error('Goal OTP email error:', err));
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${user.email}`,
      // Only expose in non-production for testing
      ...(process.env.NODE_ENV !== 'production' && { otp })
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
