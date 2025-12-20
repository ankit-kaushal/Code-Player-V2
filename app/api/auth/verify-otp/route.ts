import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/database';
import { generateToken } from '@/lib/auth';
import { getOTP, deleteOTP } from './request-otp/route';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);

    // Verify OTP from in-memory store
    const storedOtp = getOTP(email);

    if (!storedOtp || storedOtp.otp !== otp || storedOtp.expiresAt < Date.now()) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }

    // Remove OTP after use
    deleteOTP(email);

    // Check if user exists, if not create
    let user = await usersCollection.findOne({ email });

    if (!user) {
      // Create new user
      const result = await usersCollection.insertOne({
        email,
        createdAt: new Date()
      });
      const token = generateToken(result.insertedId.toString(), email);
      return NextResponse.json({
        message: 'Account created and logged in',
        token,
        userId: result.insertedId.toString(),
        email
      });
    } else {
      // Existing user, just login
      const token = generateToken(user._id.toString(), email);
      return NextResponse.json({
        message: 'Logged in successfully',
        token,
        userId: user._id.toString(),
        email
      });
    }
  } catch (error) {
    console.error('Error in verify-otp:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Store OTP in memory (called from request-otp route)
export function storeOTP(email: string, otp: string) {
  const otpKey = email.toLowerCase();
  otpStore.set(otpKey, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    email
  });
}
