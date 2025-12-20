import { getCollection, COLLECTIONS } from './database';

export async function setOTP(email: string, otp: string): Promise<void> {
  const otpKey = email.toLowerCase();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  const otpsCollection = await getCollection(COLLECTIONS.OTPS);
  
  // Delete any existing OTP for this email
  await otpsCollection.deleteOne({ email: otpKey });
  
  // Insert new OTP
  await otpsCollection.insertOne({
    email: otpKey,
    otp,
    expiresAt,
    createdAt: new Date()
  });
}

export async function getOTP(email: string): Promise<{ otp: string; expiresAt: number; email: string } | undefined> {
  const otpKey = email.toLowerCase();
  const otpsCollection = await getCollection(COLLECTIONS.OTPS);
  
  const otpDoc = await otpsCollection.findOne({ email: otpKey });
  
  if (!otpDoc) {
    return undefined;
  }
  
  return {
    otp: otpDoc.otp,
    expiresAt: otpDoc.expiresAt,
    email: otpDoc.email
  };
}

export async function deleteOTP(email: string): Promise<void> {
  const otpKey = email.toLowerCase();
  const otpsCollection = await getCollection(COLLECTIONS.OTPS);
  await otpsCollection.deleteOne({ email: otpKey });
}

// Clean up expired OTPs periodically
export async function cleanupExpiredOTPs(): Promise<void> {
  const otpsCollection = await getCollection(COLLECTIONS.OTPS);
  const now = Date.now();
  await otpsCollection.deleteMany({ expiresAt: { $lt: now } });
}

