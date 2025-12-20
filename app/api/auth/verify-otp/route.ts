import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/database';
import { generateToken } from '@/lib/auth';
import { getOTP, deleteOTP } from '@/lib/otp-store';

export async function POST(req: NextRequest) {
  try {
    const { email, otp, name, phone } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedOtp = otp.trim();

    const usersCollection = await getCollection(COLLECTIONS.USERS);

    // Verify OTP from database
    const storedOtp = await getOTP(normalizedEmail);
    
    if (!storedOtp) {
      console.error('No OTP found for email:', normalizedEmail);
      return NextResponse.json({ error: 'Invalid or expired OTP. Please request a new OTP.' }, { status: 401 });
    }

    // Compare OTPs (both should already be trimmed)
    const trimmedStoredOtp = storedOtp.otp.trim();

    if (trimmedStoredOtp !== normalizedOtp) {
      console.error('OTP mismatch:', {
        stored: trimmedStoredOtp,
        received: normalizedOtp,
        storedLength: trimmedStoredOtp.length,
        receivedLength: normalizedOtp.length
      });
      return NextResponse.json({ error: 'Invalid OTP. Please check and try again.' }, { status: 401 });
    }

    if (storedOtp.expiresAt < Date.now()) {
      console.error('OTP expired:', {
        expiresAt: storedOtp.expiresAt,
        currentTime: Date.now()
      });
      await deleteOTP(normalizedEmail);
      return NextResponse.json({ error: 'OTP has expired. Please request a new OTP.' }, { status: 401 });
    }

    await deleteOTP(normalizedEmail);

    let user = await usersCollection.findOne({ email: normalizedEmail });

    if (!user) {
      if (!name || !phone) {
        return NextResponse.json({ error: 'Name and phone number are required for signup' }, { status: 400 });
      }

      const result = await usersCollection.insertOne({
        email: normalizedEmail,
        name,
        phone,
        createdAt: new Date(),
        emailCredits: 1,
        paymentHistory: [],
        emailsSent: []
      });
      const token = generateToken(result.insertedId.toString(), normalizedEmail);
      return NextResponse.json({
        message: 'Account created and logged in',
        token,
        userId: result.insertedId.toString(),
        email: normalizedEmail
      });
    } else {
      if (name || phone) {
        return NextResponse.json({ error: 'User already exists. Please use login instead of signup.' }, { status: 400 });
      }

      const token = generateToken(user._id.toString(), normalizedEmail);
      return NextResponse.json({
        message: 'Logged in successfully',
        token,
        userId: user._id.toString(),
        email: normalizedEmail
      });
    }
  } catch (error) {
    console.error('Error in verify-otp:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
