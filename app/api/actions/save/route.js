import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Account from '@/models/Account';
import Transaction from '@/models/Transaction';
import Goal from '@/models/Goal';
import User from '@/models/User';
import { getSessionUser } from '@/lib/auth';
import { validateAmount } from '@/lib/validateAmount';
import { sendEmail } from '@/lib/email';

export async function POST(req) {
  try {
    const session = getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount, source, goal_id } = await req.json();
    const amtCheck = validateAmount(amount);
    if (!amtCheck.valid) return NextResponse.json({ error: 'INVALID_AMOUNT', message: amtCheck.error }, { status: 400 });

    await connectToDatabase();

    const user_id = session.userId;
    const account = await Account.findOne({ user_id });
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    // ── Streak logic (your existing code, unchanged) ──────────────────────────
    const now = new Date();
    let streakBroken = false;

    if (!account.lastActionAt) {
      account.currentStreak = 1;
      account.lastActionAt = now;
    } else {
      const diffMins = Math.floor((now - account.lastActionAt) / 60000);
      if (diffMins >= 60 && diffMins <= 90) {
        account.currentStreak += 1;
        account.lastActionAt = now;
      } else if (diffMins > 90) {
        streakBroken = account.currentStreak > 1; // was on a streak before reset
        account.currentStreak = 1;
        account.lastActionAt = now;
      }
    }
    const currentStreak = account.currentStreak || 1;
    // ── End streak logic ──────────────────────────────────────────────────────

    let savedGoal = null;

    if (goal_id) {
      savedGoal = await Goal.findById(goal_id);
      if (!savedGoal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

      if (source === 'bank') {
        if (account.main_balance < amount) {
          return NextResponse.json({ error: 'Insufficient main balance' }, { status: 400 });
        }
        account.main_balance -= amount;
      }

      savedGoal.saved_amount = (savedGoal.saved_amount || 0) + amount;

      const contribIndex = savedGoal.contributions.findIndex(
        c => c.user_id.toString() === user_id.toString()
      );
      if (contribIndex >= 0) {
        savedGoal.contributions[contribIndex].amount += amount;
      } else {
        savedGoal.contributions.push({ user_id, amount });
      }

      await savedGoal.save();
    } else {
      if (source === 'bank') {
        if (account.main_balance < amount) {
          return NextResponse.json({ error: 'Insufficient main balance' }, { status: 400 });
        }
        account.main_balance -= amount;
        account.savings_wallet += amount;
      } else if (source === 'cash') {
        account.cash_savings += amount;
      } else {
        return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
      }
    }

    await account.save();

    await Transaction.create({
      user_id,
      type: 'save',
      amount,
      source: source === 'bank' ? 'wallet' : 'cash',
    });

    // ── ALL EMAILS ────────────────────────────────────────────────────────────
    const user = await User.findById(user_id).select('name email');
    const totalSaved = (account.savings_wallet || 0) + (account.cash_savings || 0);

    // ── EMAIL 1: Save success (always fires) ──────────────────────────────────
    const goalBlock = savedGoal ? `
      <div style="background:#eff6ff;border:1.5px solid #93c5fd;
                  border-radius:12px;padding:16px 20px;margin:16px 0;">
        <p style="margin:0 0 8px;font-size:13px;color:#1e40af;font-weight:600;">
          🎯 GOAL PROGRESS
        </p>
        <p style="margin:0;font-size:15px;color:#1e3a8a;">
          <strong>${savedGoal.name}</strong>
        </p>
        <p style="margin:6px 0 10px;font-size:14px;color:#3b82f6;">
          ₹${savedGoal.saved_amount.toLocaleString('en-IN')} saved of
          ₹${savedGoal.target_amount.toLocaleString('en-IN')} target
        </p>
        <div style="background:#dbeafe;border-radius:99px;height:10px;overflow:hidden;">
          <div style="background:#3b82f6;height:100%;
                      width:${Math.min(100, Math.round((savedGoal.saved_amount / savedGoal.target_amount) * 100))}%;
                      border-radius:99px;">
          </div>
        </div>
        <p style="margin:8px 0 0;font-size:12px;color:#60a5fa;text-align:right;">
          ${Math.min(100, Math.round((savedGoal.saved_amount / savedGoal.target_amount) * 100))}% complete
        </p>
      </div>` : `
      <div style="background:#ecfdf5;border:1.5px solid #6ee7b7;
                  border-radius:12px;padding:16px 20px;margin:16px 0;">
        <p style="margin:0;font-size:15px;color:#065f46;">
          🏦 Total saved so far:
          <strong style="font-size:18px;">
            ₹${totalSaved.toLocaleString('en-IN')}
          </strong>
        </p>
      </div>`;

    const streakMsg =
      currentStreak >= 7 ? "A full week of saving! You're absolutely on fire 🔥" :
        currentStreak >= 3 ? `${currentStreak} days in a row! The habit is forming 🌱` :
          "You're building a habit. Keep going 😊";

    sendEmail({
      to: user.email,
      subject: 'Nice move 💚 — you just saved!',
      html: `
        <!DOCTYPE html><html>
        <body style="margin:0;padding:0;background:#f3f4f6;
                     font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
            <tr><td align="center">
              <table width="520" cellpadding="0" cellspacing="0"
                     style="background:#fff;border-radius:16px;
                            border:1px solid #e5e7eb;overflow:hidden;">
                <tr>
                  <td style="background:#10b981;padding:24px 32px;">
                    <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">
                      💰 SaveMate
                    </h1>
                    <p style="margin:4px 0 0;color:#d1fae5;font-size:13px;">
                      Your smart savings companion
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <h2 style="margin:0 0 12px;color:#111827;font-size:22px;">
                      You did it, ${user.name}! 🎉
                    </h2>
                    <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 4px;">
                      You just saved
                      <strong style="color:#10b981;font-size:20px;">
                        ₹${amount.toLocaleString('en-IN')}
                      </strong>.
                      That's discipline in action 💪
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0"
                           style="margin:16px 0;">
                      <tr>
                        <td width="48%" style="background:#ecfdf5;border-radius:10px;
                                               padding:16px;text-align:center;">
                          <div style="font-size:26px;font-weight:700;color:#10b981;">
                            🔥 ${currentStreak}
                          </div>
                          <div style="font-size:12px;color:#065f46;margin-top:4px;">
                            Day streak
                          </div>
                        </td>
                        <td width="4%"></td>
                        <td width="48%" style="background:#eff6ff;border-radius:10px;
                                               padding:16px;text-align:center;">
                          <div style="font-size:20px;font-weight:700;color:#3b82f6;">
                            ₹${totalSaved.toLocaleString('en-IN')}
                          </div>
                          <div style="font-size:12px;color:#1e40af;margin-top:4px;">
                            Total saved
                          </div>
                        </td>
                      </tr>
                    </table>
                    ${goalBlock}
                    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
                      ${streakMsg}
                    </p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                       style="display:inline-block;padding:14px 28px;background:#10b981;
                              color:#fff;border-radius:10px;text-decoration:none;
                              font-weight:600;font-size:15px;">
                      View your progress →
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px;background:#f9fafb;
                             border-top:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                      You're receiving this as a SaveMate user.<br/>
                      Building better saving habits, one day at a time 🌱
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body></html>
      `,
    });

    // ── EMAIL 2: Goal near completion (fires when goal hits 90%+) ────────────
    if (savedGoal) {
      const pct = savedGoal.saved_amount / savedGoal.target_amount;
      const remaining = savedGoal.target_amount - savedGoal.saved_amount;

      if (pct >= 0.9 && pct < 1) {
        sendEmail({
          to: user.email,
          subject: "You're almost there 🚀 — finish your goal!",
          html: `
            <!DOCTYPE html><html>
            <body style="margin:0;padding:0;background:#f3f4f6;
                         font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
                <tr><td align="center">
                  <table width="520" cellpadding="0" cellspacing="0"
                         style="background:#fff;border-radius:16px;
                                border:1px solid #e5e7eb;overflow:hidden;">
                    <tr>
                      <td style="background:#6366f1;padding:24px 32px;">
                        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">
                          💰 SaveMate
                        </h1>
                        <p style="margin:4px 0 0;color:#e0e7ff;font-size:13px;">
                          Your smart savings companion
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:32px;">
                        <h2 style="margin:0 0 12px;color:#111827;font-size:22px;">
                          So close, ${user.name}! 🎯
                        </h2>
                        <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 16px;">
                          Your goal <strong>"${savedGoal.name}"</strong> is almost done.
                          You've already done the hard part!
                        </p>
                        <div style="background:#f3f4f6;border-radius:12px;
                                    padding:20px;margin:0 0 16px;">
                          <div style="background:#e5e7eb;border-radius:99px;
                                      height:14px;overflow:hidden;">
                            <div style="background:#6366f1;height:100%;
                                        width:${Math.round(pct * 100)}%;
                                        border-radius:99px;">
                            </div>
                          </div>
                          <p style="margin:12px 0 0;font-size:16px;color:#111827;
                                    font-weight:700;text-align:center;">
                            Just ₹${Math.ceil(remaining).toLocaleString('en-IN')} more to go!
                          </p>
                        </div>
                        <p style="color:#6b7280;font-size:14px;
                                  line-height:1.6;margin:0 0 24px;">
                          One final push and <strong>"${savedGoal.name}"</strong>
                          is yours 🏁
                        </p>
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                           style="display:inline-block;padding:14px 28px;
                                  background:#6366f1;color:#fff;border-radius:10px;
                                  text-decoration:none;font-weight:600;font-size:15px;">
                          Finish strong →
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:20px 32px;background:#f9fafb;
                                 border-top:1px solid #e5e7eb;">
                        <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                          Building better saving habits, one day at a time 🌱
                        </p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
          `,
        });
      }
    }

    // ── EMAIL 3: Streak broken (fires when streak resets) ─────────────────────
    if (streakBroken) {
      sendEmail({
        to: user.email,
        subject: 'Your streak broke 😬 — but you\'re back!',
        html: `
          <!DOCTYPE html><html>
          <body style="margin:0;padding:0;background:#f3f4f6;
                       font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
              <tr><td align="center">
                <table width="520" cellpadding="0" cellspacing="0"
                       style="background:#fff;border-radius:16px;
                              border:1px solid #e5e7eb;overflow:hidden;">
                  <tr>
                    <td style="background:#f59e0b;padding:24px 32px;">
                      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">
                        💰 SaveMate
                      </h1>
                      <p style="margin:4px 0 0;color:#fef3c7;font-size:13px;">
                        Your smart savings companion
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px;">
                      <h2 style="margin:0 0 12px;color:#111827;font-size:22px;">
                        Streak reset, ${user.name} 😬
                      </h2>
                      <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 16px;">
                        Your saving streak was interrupted — but the good news?
                        <strong>You're already back!</strong> 
                        You just saved ₹${amount.toLocaleString('en-IN')} and
                        started a brand new streak 🔥
                      </p>
                      <div style="background:#fff7ed;border:1.5px solid #fdba74;
                                  border-radius:12px;padding:16px 20px;margin:0 0 20px;">
                        <p style="margin:0;font-size:14px;color:#92400e;">
                          💡 <strong>Tip:</strong> Save a little every day —
                          even ₹10 keeps your streak alive. Consistency beats
                          perfection every time.
                        </p>
                      </div>
                      <p style="color:#6b7280;font-size:14px;
                                line-height:1.6;margin:0 0 24px;">
                        New streak started: <strong>🔥 1 day</strong>.
                        Let's build it back up!
                      </p>
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                         style="display:inline-block;padding:14px 28px;
                                background:#f59e0b;color:#fff;border-radius:10px;
                                text-decoration:none;font-weight:600;font-size:15px;">
                        Keep going →
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 32px;background:#f9fafb;
                               border-top:1px solid #e5e7eb;">
                      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                        Building better saving habits, one day at a time 🌱
                      </p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </body></html>
        `,
      });
    }

    // ── EMAIL 4: Milestone reached (₹1000 / ₹5000 / ₹10000) ─────────────────
    const milestones = [1000, 5000, 10000, 25000, 50000];
    const prevTotal = totalSaved - amount;
    const hitMilestone = milestones.find(
      m => prevTotal < m && totalSaved >= m
    );

    if (hitMilestone) {
      sendEmail({
        to: user.email,
        subject: `You just hit ₹${hitMilestone.toLocaleString('en-IN')} in savings! 🏆`,
        html: `
          <!DOCTYPE html><html>
          <body style="margin:0;padding:0;background:#f3f4f6;
                       font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
              <tr><td align="center">
                <table width="520" cellpadding="0" cellspacing="0"
                       style="background:#fff;border-radius:16px;
                              border:1px solid #e5e7eb;overflow:hidden;">
                  <tr>
                    <td style="background:linear-gradient(135deg,#10b981,#6366f1);
                               padding:24px 32px;">
                      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">
                        💰 SaveMate
                      </h1>
                      <p style="margin:4px 0 0;color:#e0e7ff;font-size:13px;">
                        Your smart savings companion
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px;text-align:center;">
                      <div style="font-size:56px;margin-bottom:16px;">🏆</div>
                      <h2 style="margin:0 0 12px;color:#111827;font-size:24px;">
                        Milestone unlocked, ${user.name}!
                      </h2>
                      <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 20px;">
                        You've crossed
                        <strong style="color:#10b981;font-size:22px;">
                          ₹${hitMilestone.toLocaleString('en-IN')}
                        </strong>
                        in total savings!
                      </p>
                      <div style="background:linear-gradient(135deg,#ecfdf5,#eff6ff);
                                  border-radius:16px;padding:24px;margin:0 0 20px;">
                        <p style="margin:0;font-size:13px;color:#6b7280;">
                          Total savings
                        </p>
                        <p style="margin:8px 0 0;font-size:32px;font-weight:700;
                                  color:#10b981;">
                          ₹${totalSaved.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <p style="color:#6b7280;font-size:14px;
                                line-height:1.6;margin:0 0 24px;">
                        This is what consistency looks like 💪
                        Keep pushing — the next milestone is waiting!
                      </p>
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                         style="display:inline-block;padding:14px 28px;
                                background:#10b981;color:#fff;border-radius:10px;
                                text-decoration:none;font-weight:600;font-size:15px;">
                        See your savings →
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 32px;background:#f9fafb;
                               border-top:1px solid #e5e7eb;">
                      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                        Building better saving habits, one day at a time 🌱
                      </p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </body></html>
        `,
      });
    }
    // ── END ALL EMAILS ────────────────────────────────────────────────────────

    if (global.io) {
      const notify = new Set([user_id]);
      if (savedGoal) {
        notify.add(savedGoal.user_id.toString());
        savedGoal.shared_with?.forEach(id => notify.add(id.toString()));
      }
      notify.forEach(uid => global.io.to(`user_${uid}`).emit('data_updated'));
    }

    return NextResponse.json({ success: true, message: `Saved ₹${amount}` });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}