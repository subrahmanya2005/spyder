import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Goal from '@/models/Goal';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "hackathon-secret-key-123";

export async function POST(req) {
  try {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { goal_id } = await req.json();
    if (!goal_id) return NextResponse.json({ error: "Goal ID is required" }, { status: 400 });

    await connectToDatabase();

    const goal = await Goal.findById(goal_id);
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    if (goal.user_id.toString() !== userId) {
      return NextResponse.json({ error: "Only the goal owner can generate an invite" }, { status: 403 });
    }

    if (!goal.invite_token) {
      // Create a random token
      const randomToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      goal.invite_token = randomToken;
      await goal.save();
    }

    return NextResponse.json({
      success: true,
      invite_token: goal.invite_token
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
