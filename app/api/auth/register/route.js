import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Account from '@/models/Account';
import bcrypt from 'bcryptjs';
import { createToken, setAuthCookie } from '@/lib/auth';

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      name, gender, email, phone, password,
      address, pincode,
      occupation, average_income, current_salary, days_of_work,
      bank_name, bank_account_number, bank_ifsc,
      aadhaar_number, pan_photo_url, profile_photo_url,
    } = body;

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'Name, email, phone and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered. Please login.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name, gender, email, phone,
      password: hashedPassword,
      address, pincode,
      occupation,
      average_income: Number(average_income) || 0,
      current_salary: Number(current_salary) || 0,
      days_of_work:   Number(days_of_work)   || 0,
      bank_name, bank_account_number, bank_ifsc,
      aadhaar_number, pan_photo_url, profile_photo_url,
      is_profile_complete: true,
    });

    await Account.create({
      user_id: user._id,
      main_balance:       0,
      savings_wallet:     0,
      cash_savings:       0,
      investment_balance: 0,
    });

    const token = createToken(user._id);
    const response = NextResponse.json({ success: true, message: 'Account created successfully' }, { status: 201 });
    return setAuthCookie(response, token);

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
