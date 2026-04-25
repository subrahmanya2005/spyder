import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Goal from '@/models/Goal';
import { getSessionUser } from '@/lib/auth';

export async function POST(req) {
  try {
    const session = getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { goal_id } = await req.json();
    if (!goal_id) return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });

    await connectToDatabase();

    const goal = await Goal.findById(goal_id);
    if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

    if (goal.user_id.toString() !== session.userId) {
      return NextResponse.json({ error: 'You can only delete your own goals' }, { status: 403 });
    }

    await Goal.findByIdAndDelete(goal_id);

    return NextResponse.json({ success: true, message: 'Goal deleted' });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
