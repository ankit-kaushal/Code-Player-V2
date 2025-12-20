import { NextRequest, NextResponse } from 'next/server';
import { sendOTP } from '@/lib/email';
import { generateOTP } from '@/lib/auth';

// In-memory OTP storage (expires after 10 minutes)
const otpStore = new Map<string, { otp: string; expiresAt: number; email: string }>();

// Clean up expired OTPs every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (value.expiresAt < now) {
      otpStore.delete(key);
    }
  }
}, 60000);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const otp = generateOTP();
    const otpKey = email.toLowerCase();

    // Store OTP in memory (not database)
    otpStore.set(otpKey, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      email
    });

    try {
      await sendOTP(email, otp);
      return NextResponse.json({ message: 'OTP sent to your email' });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      otpStore.delete(otpKey); // Remove OTP if email failed
      return NextResponse.json({ error: 'Failed to send OTP email' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in request-otp:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Export for use in verify-otp
export function getOTP(email: string): { otp: string; expiresAt: number; email: string } | undefined {
  return otpStore.get(email.toLowerCase());
}

export function deleteOTP(email: string): void {
  otpStore.delete(email.toLowerCase());
}
