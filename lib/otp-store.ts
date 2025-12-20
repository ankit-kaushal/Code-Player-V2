const otpStore = new Map<string, { otp: string; expiresAt: number; email: string }>();

setInterval(() => {
  const now = Date.now();
  Array.from(otpStore.entries()).forEach(([key, value]) => {
    if (value.expiresAt < now) {
      otpStore.delete(key);
    }
  });
}, 60000);

export function setOTP(email: string, otp: string): void {
  const otpKey = email.toLowerCase();
  otpStore.set(otpKey, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    email
  });
}

export function getOTP(email: string): { otp: string; expiresAt: number; email: string } | undefined {
  return otpStore.get(email.toLowerCase());
}

export function deleteOTP(email: string): void {
  otpStore.delete(email.toLowerCase());
}

