"use client";

import React, { useState } from "react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (token: string, userData: { userId: string; email: string }) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
}) => {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

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
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid OTP");
      }

      onLogin(data.token, { userId: data.userId, email: data.email });
      onClose();
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("email");
    setEmail("");
    setOtp("");
    setError("");
    setMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
      onClick={handleClose}
    >
      <div
        className="bg-white p-8 rounded-lg max-w-md w-90 relative shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-4 text-2xl text-gray-600 hover:text-black"
          onClick={handleClose}
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Login / Sign Up
        </h2>

        {step === "email" ? (
          <form onSubmit={handleRequestOTP} className="flex flex-col gap-4">
            <p className="text-gray-600">Enter your email to receive an OTP</p>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="p-3 border-2 border-gray-300 rounded focus:outline-none focus:border-green-500"
            />
            {error && (
              <div className="text-red-600 p-3 bg-red-50 rounded text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="text-green-600 p-3 bg-green-50 rounded text-sm">
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
            <p className="text-gray-600">Enter the OTP sent to {email}</p>
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
              className="p-3 border-2 border-gray-300 rounded focus:outline-none focus:border-green-500"
            />
            {error && (
              <div className="text-red-600 p-3 bg-red-50 rounded text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="text-green-600 p-3 bg-green-50 rounded text-sm">
                {message}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("email")}
                disabled={loading}
                className="flex-1 p-3 bg-gray-500 text-white rounded font-bold hover:bg-gray-600 disabled:bg-gray-400"
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
