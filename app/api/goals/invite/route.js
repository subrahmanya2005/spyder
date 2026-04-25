import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Goal from '@/models/Goal';
import User from '@/models/User'; // required for populate

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    await connectToDatabase();

    const goal = await Goal.findOne({ invite_token: token }).populate('user_id', 'name');
    
    if (!goal) {
      return NextResponse.json({ error: "Invalid or expired invite link" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      goal: {
        _id: goal._id,
        name: goal.name,
        target_amount: goal.target_amount,
        owner_name: goal.user_id?.name || "Someone"
      }
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
