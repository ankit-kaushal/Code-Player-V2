"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  html: string;
  css: string;
  js: string;
}

const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  html,
  css,
  js,
}) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [canSend, setCanSend] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkCanSend();
    } else {
      setCredits(null);
      setCreditsLoading(true);
      setError("");
      setMessage("");
    }
  }, [isOpen]);

  const checkCanSend = async () => {
    setCreditsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/email/can-send", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCanSend(data.canSend);
        setCredits(data.credits || 0);
        if (!data.canSend) {
          setError(
            `Insufficient email credits. You have ${
              data.credits || 0
            } credits. Please purchase credits to send emails.`
          );
        }
      }
    } catch (err) {
      console.error("Error checking can send:", err);
      setError("Failed to check email credits");
    } finally {
      setCreditsLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/email/send-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, html, css, js }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      setMessage(
        `Test email sent successfully! Remaining credits: ${
          data.remainingCredits || credits - 1
        }`
      );
      setCredits(data.remainingCredits || credits - 1);
      setEmail("");
      setTimeout(() => {
        onClose();
        setMessage("");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
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
          Send Test Email
        </h2>
        <p className="text-sm text-gray-600 mb-2">
          Email Credits:{" "}
          {creditsLoading ? (
            <span className="text-gray-400">Loading...</span>
          ) : (
            <span className="font-bold text-blue-600">{credits ?? 0}</span>
          )}
        </p>

        <form onSubmit={handleSend} className="flex flex-col gap-4">
          <p className="text-gray-600">
            Enter the email address to send your code to:
          </p>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || !canSend}
            className="p-3 border-2 border-gray-300 rounded focus:outline-none focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {error && (
            <div className="text-red-600 p-3 bg-red-50 rounded text-sm">
              {error}
              {!canSend && (
                <button
                  onClick={() => {
                    onClose();
                    router.push("/account");
                  }}
                  className="mt-2 block text-blue-600 hover:underline"
                >
                  Purchase Credits →
                </button>
              )}
            </div>
          )}
          {message && (
            <div className="text-green-600 p-3 bg-green-50 rounded text-sm">
              {message}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !canSend}
            className="p-3 bg-green-500 text-white rounded font-bold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Email"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmailModal;
