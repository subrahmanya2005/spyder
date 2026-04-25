import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Transaction from '@/models/Transaction';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "hackathon-secret-key-123";

export async function GET(req) {
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

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');

    let query = Transaction.find({ user_id: userId }).sort({ date: -1 });

    if (limitParam && limitParam !== 'all') {
      const limitVal = parseInt(limitParam, 10);
      if (!isNaN(limitVal)) {
        query = query.limit(limitVal);
      }
    }

    const transactions = await query.lean();

    return NextResponse.json({ transactions });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
