import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Goal from '@/models/Goal';
import { getSessionUser } from '@/lib/auth';
import { validateAmount } from '@/lib/validateAmount';

export async function POST(req) {
  try {
    const session = getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, target_amount, duration_days } = await req.json();
    if (!name || !target_amount || !duration_days) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    const amtCheck = validateAmount(target_amount);
    if (!amtCheck.valid) return NextResponse.json({ error: 'INVALID_AMOUNT', message: amtCheck.error }, { status: 400 });

    await connectToDatabase();

    const goal = await Goal.create({
      user_id:       session.userId,
      name,
      target_amount:  Number(target_amount),
      duration_days:  Number(duration_days),
    });

    return NextResponse.json({ success: true, goal });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
