"use client";

import React, { useState, useEffect } from "react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (
    token: string,
    userData: {
      userId: string;
      email: string;
      name?: string | null;
      phone?: string | null;
    }
  ) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
}) => {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [step, setStep] = useState<"form" | "otp">("form");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  const sendOTP = async () => {
    setError("");
    setMessage("");
    setResendLoading(true);

    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setMessage("OTP sent to your email!");
      setResendTimer(60);
      if (step === "form") {
        setStep("otp");
      }
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setResendLoading(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await sendOTP();
    setLoading(false);
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    await sendOTP();
  };

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const requestBody: any = { email, otp };

      if (mode === "signup") {
        requestBody.name = name;
        requestBody.phone = phone;
      }

      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid OTP");
      }

      onLogin(data.token, {
        userId: data.userId,
        email: data.email,
        name: data.name ?? (mode === "signup" ? name.trim() : null),
        phone:
          data.phone ??
          (mode === "signup" ? phone.replace(/\D/g, "") : null),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMode("signup");
    setStep("form");
    setName("");
    setEmail("");
    setPhone("");
    setOtp("");
    setError("");
    setMessage("");
    setResendTimer(0);
    onClose();
  };

  if (!isOpen) return null;

  const inputClass =
    "p-3 border-2 border-gray-300 dark:border-[#2b2b2b] dark:bg-[#181818] dark:text-[#d4d4d4] rounded focus:outline-none focus:border-green-500 dark:focus:border-[#aed8aa] disabled:opacity-60";

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-[#1f1f1f] p-4 sm:p-8 rounded-lg max-w-2xl w-full mx-2 sm:mx-4 relative shadow-xl max-h-[90vh] overflow-y-auto dark:border dark:border-[#2b2b2b]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-4 text-2xl text-gray-600 dark:text-[#8a8a8a] hover:text-black dark:hover:text-[#d4d4d4]"
          onClick={handleClose}
        >
          ×
        </button>

        <div className="flex gap-4 mb-4 border-b border-gray-200 dark:border-[#2b2b2b]">
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setStep("form");
              setError("");
              setMessage("");
              setResendTimer(0);
            }}
            className={`pb-2 px-4 font-semibold ${
              mode === "signup"
                ? "text-green-600 dark:text-[#aed8aa] border-b-2 border-green-600 dark:border-[#aed8aa]"
                : "text-gray-500 dark:text-[#8a8a8a]"
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setStep("form");
              setError("");
              setMessage("");
              setResendTimer(0);
            }}
            className={`pb-2 px-4 font-semibold ${
              mode === "login"
                ? "text-green-600 dark:text-[#aed8aa] border-b-2 border-green-600 dark:border-[#aed8aa]"
                : "text-gray-500 dark:text-[#8a8a8a]"
            }`}
          >
            Login
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-[#d4d4d4]">
          {mode === "signup" ? "Create Account" : "Login"}
        </h2>

        {step === "form" ? (
          <form onSubmit={handleRequestOTP} className="flex flex-col gap-4">
            {mode === "signup" && (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  className={inputClass}
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  required
                  maxLength={10}
                  disabled={loading}
                  className={inputClass}
                />
              </>
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className={inputClass}
            />
            {error && (
              <div className="text-red-600 dark:text-[#f48771] p-3 bg-red-50 dark:bg-[#2e1a1a] rounded text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="text-green-600 dark:text-[#aed8aa] p-3 bg-green-50 dark:bg-[#1a2e1a] rounded text-sm">
                {message}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="p-3 bg-green-500 text-white rounded font-bold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
            <p className="text-gray-600 dark:text-[#8a8a8a]">
              Enter the OTP sent to {email}
            </p>
            <input
              type="text"
              placeholder="OTP (6 digits)"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required
              maxLength={6}
              disabled={loading}
              className={inputClass}
            />
            {error && (
              <div className="text-red-600 dark:text-[#f48771] p-3 bg-red-50 dark:bg-[#2e1a1a] rounded text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="text-green-600 dark:text-[#aed8aa] p-3 bg-green-50 dark:bg-[#1a2e1a] rounded text-sm">
                {message}
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-[#8a8a8a]">
              <span>Didn&apos;t receive OTP?</span>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendTimer > 0 || resendLoading || loading}
                className="text-green-600 dark:text-[#aed8aa] font-semibold hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {resendLoading
                  ? "Sending..."
                  : resendTimer > 0
                  ? `Resend in ${resendTimer}s`
                  : "Resend OTP"}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("form")}
                disabled={loading}
                className="flex-1 p-3 bg-gray-500 dark:bg-[#3a3a3a] text-white rounded font-bold hover:bg-gray-600 dark:hover:bg-[#444444] disabled:bg-gray-400"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="flex-1 p-3 bg-green-500 text-white rounded font-bold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
