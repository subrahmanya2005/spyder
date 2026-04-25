import { NextResponse } from 'next/server';

export async function POST() {
  console.log("Logout route hit")
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.set('auth_token', '', { expires: new Date(0), path: '/' });
  return response;
}
