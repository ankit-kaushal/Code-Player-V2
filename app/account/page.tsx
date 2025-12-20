"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Header from "../components/Header";

declare global {
  interface Window {
    Cashfree: any;
  }
}

const EMAIL_PACKAGES = [
  { id: "1", emails: 1, price: 5, displayPrice: "₹5" },
  { id: "5", emails: 5, price: 20, displayPrice: "₹20" },
  { id: "10", emails: 10, price: 40, displayPrice: "₹40" },
  { id: "100", emails: 100, price: 350, displayPrice: "₹350" },
];

export default function AccountPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  console.log("user", user);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push("/");
      return;
    }
    loadCredits();
    loadCashfreeScript();
  }, [user, authLoading, router]);

  const loadCashfreeScript = () => {
    if (document.getElementById("cashfree-script")) return;

    const script = document.createElement("script");
    script.id = "cashfree-script";
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    document.body.appendChild(script);
  };

  const loadCredits = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user/credits", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
        setPaymentHistory(data.paymentHistory || []);
      }
    } catch (error) {
      console.error("Error loading credits:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    setProcessing(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      // Create payment session
      const sessionResponse = await fetch("/api/payment/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packageId }),
      });

      const sessionData = await sessionResponse.json();

      if (!sessionResponse.ok) {
        throw new Error(
          sessionData.error || "Failed to create payment session"
        );
      }

      // Initialize Cashfree Checkout
      if (!window.Cashfree) {
        throw new Error("Cashfree SDK not loaded. Please refresh the page.");
      }

      const cashfree = window.Cashfree({
        mode:
          (process.env.NEXT_PUBLIC_CASHFREE_MODE as "sandbox" | "production") ||
          "sandbox",
      });

      const checkout = cashfree.checkout({
        paymentSessionId: sessionData.paymentSessionId,
        redirectTarget: "_self",
      });

      checkout.redirect();
    } catch (error: any) {
      setMessage(error.message || "Failed to initiate payment");
      setProcessing(false);
    }
  };

  const verifyPayment = async (orderId: string, packageId: string) => {
    try {
      const token = localStorage.getItem("token");
      const urlParams = new URLSearchParams(window.location.search);
      const paymentId = urlParams.get("paymentId") || "";
      const signature = urlParams.get("signature") || "";
      const orderToken = urlParams.get("order_token") || "";

      const verifyResponse = await fetch("/api/payment/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          paymentId,
          signature,
          orderToken,
          packageId,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (verifyResponse.ok) {
        setMessage(
          `Payment successful! ${verifyData.credits} credits added to your account.`
        );
        await loadCredits();
        window.history.replaceState({}, "", "/account");
      } else {
        setMessage(verifyData.error || "Payment verification failed");
      }
    } catch (error: any) {
      setMessage("Error verifying payment: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    // Check if returning from payment
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment_status");

    if (paymentStatus === "success") {
      const orderId = urlParams.get("orderId");
      const packageId = urlParams.get("packageId");

      if (orderId && packageId) {
        verifyPayment(orderId, packageId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-3xl font-bold mb-4">My Account</h1>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Email: {user?.email}</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  Email Credits: {credits}
                </p>
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.includes("successful")
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Purchase Email Credits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {EMAIL_PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {pkg.emails}
                    </div>
                    <div className="text-gray-600 mb-2">Email Credits</div>
                    <div className="text-2xl font-bold mb-4">
                      {pkg.displayPrice}
                    </div>
                    <button
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={processing}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {processing ? "Processing..." : "Purchase"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {paymentHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Payment History</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Package</th>
                      <th className="text-left p-2">Credits</th>
                      <th className="text-left p-2">Amount</th>
                      <th className="text-left p-2">Payment ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory
                      .slice()
                      .reverse()
                      .map((payment: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">
                            {new Date(payment.date).toLocaleDateString()}
                          </td>
                          <td className="p-2">{payment.emails} emails</td>
                          <td className="p-2">{payment.emails}</td>
                          <td className="p-2">₹{payment.amount}</td>
                          <td className="p-2 text-sm text-gray-600">
                            {payment.paymentId?.substring(0, 20)}...
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
