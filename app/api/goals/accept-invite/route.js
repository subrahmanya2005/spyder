import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Goal from '@/models/Goal';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "hackathon-secret-key-123";

export async function POST(req) {
  try {
    const cookieToken = req.cookies.get('auth_token')?.value;

    if (!cookieToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId;
    try {
      const decoded = jwt.verify(cookieToken, JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { invite_token } = await req.json();
    if (!invite_token) return NextResponse.json({ error: "Invite token is required" }, { status: 400 });

    await connectToDatabase();

    const goal = await Goal.findOne({ invite_token });
    if (!goal) return NextResponse.json({ error: "Invalid or expired invite link" }, { status: 404 });

    if (goal.user_id.toString() === userId) {
      return NextResponse.json({ error: "You are already the owner of this goal" }, { status: 400 });
    }

    if (!goal.shared_with.includes(userId)) {
      goal.shared_with.push(userId);
      await goal.save();
    }

    return NextResponse.json({
      success: true,
      message: "Successfully joined the goal"
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
