import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Account from '@/models/Account';
import Goal from '@/models/Goal';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "hackathon-secret-key-123";

export async function GET(req) {
  try {
    // ✅ FIX 1: Use SAME cookie name everywhere
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 401,
          headers: { 'Cache-Control': 'no-store' } // ✅ FIX 2
        }
      );
    }

    let userId;

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid token" },
        {
          status: 401,
          headers: { 'Cache-Control': 'no-store' }
        }
      );
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        {
          status: 404,
          headers: { 'Cache-Control': 'no-store' }
        }
      );
    }

    const account = await Account.findOne({ user_id: user._id });
    const goals = await Goal.find({ 
      $or: [
        { user_id: user._id },
        { shared_with: user._id }
      ]
    })
    .populate('user_id', 'name email')
    .populate('shared_with', 'name email')
    .populate('contributions.user_id', 'name email');

    // ✅ Total savings calculation
    let total_saved = account
      ? (account.savings_wallet + account.cash_savings + account.investment_balance)
      : 0;

    if (goals && goals.length > 0) {
      for (const goal of goals) {
        total_saved += (goal.saved_amount || 0);
      }
    }

    // ✅ FINAL RESPONSE (NO CACHE)
    return NextResponse.json(
      {
        user,
        account,
        goals,
        stats: {
          total_saved
        }
      },
      {
        headers: {
          'Cache-Control': 'no-store', // 🔥 VERY IMPORTANT
        }
      }
    );

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' }
      }
    );
  }
}