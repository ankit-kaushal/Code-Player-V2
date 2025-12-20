import { NextRequest, NextResponse } from 'next/server';
import { sendOTP } from '@/lib/email';
import { generateOTP } from '@/lib/auth';
import { setOTP, deleteOTP } from '@/lib/otp-store';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const otp = generateOTP();

    setOTP(email, otp);

    try {
      await sendOTP(email, otp);
      return NextResponse.json({ message: 'OTP sent to your email' });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      deleteOTP(email);
      return NextResponse.json({ error: 'Failed to send OTP email' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in request-otp:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
