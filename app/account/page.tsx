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

  const redirectToCashfree = (paymentSessionId: string, mode: string) => {
    // Use the correct Cashfree checkout URL format
    // Ensure we always use https://
    const baseUrl =
      mode === "production"
        ? "https://www.cashfree.com"
        : "https://sandbox.cashfree.com";

    // Clean the payment session ID to ensure no extra characters
    const cleanSessionId = String(paymentSessionId || "").trim();

    if (!cleanSessionId) {
      console.error("Payment session ID is empty");
      return;
    }

    // Use the checkout/post/submit endpoint format
    const checkoutUrl = `${baseUrl}/checkout/post/submit?payment_session_id=${encodeURIComponent(
      cleanSessionId
    )}`;

    console.log("Redirecting to Cashfree:", checkoutUrl);
    window.location.href = checkoutUrl;
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

      // Wait for Cashfree SDK to be fully loaded
      let retries = 0;
      while (!window.Cashfree && retries < 20) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        retries++;
      }

      if (!window.Cashfree) {
        throw new Error("Cashfree SDK not loaded. Please refresh the page.");
      }

      const cashfreeMode =
        (process.env.NEXT_PUBLIC_CASHFREE_MODE as "sandbox" | "production") ||
        "sandbox";

      // Initialize Cashfree
      const cashfree = window.Cashfree({
        mode: cashfreeMode,
      });

      // Try to use checkout method - it returns a promise
      try {
        const checkoutPromise = cashfree.checkout({
          paymentSessionId: sessionData.paymentSessionId,
          redirectTarget: "_self",
        });

        // Check if it's a promise
        if (checkoutPromise && typeof checkoutPromise.then === "function") {
          // It's a promise, handle it
          checkoutPromise
            .then((result: any) => {
              if (result && result.error) {
                console.error("Checkout error:", result.error);
                // Fallback to manual redirect
                redirectToCashfree(sessionData.paymentSessionId, cashfreeMode);
              }
              // If no error, the redirect should have happened automatically
            })
            .catch((error: any) => {
              console.error("Checkout promise error:", error);
              // Fallback to manual redirect
              redirectToCashfree(sessionData.paymentSessionId, cashfreeMode);
            });
        } else if (
          checkoutPromise &&
          typeof checkoutPromise.redirect === "function"
        ) {
          // It has a redirect method
          checkoutPromise.redirect();
        } else {
          // Fallback to manual redirect
          redirectToCashfree(sessionData.paymentSessionId, cashfreeMode);
        }
      } catch (checkoutError: any) {
        console.error("Error initializing checkout:", checkoutError);
        // Fallback to manual redirect
        redirectToCashfree(sessionData.paymentSessionId, cashfreeMode);
      }
    } catch (error: any) {
      setMessage(error.message || "Failed to initiate payment");
      setProcessing(false);
    }
  };

  const checkPaymentStatus = async (orderId: string, packageId: string) => {
    try {
      const token = localStorage.getItem("token");
      const verifyResponse = await fetch("/api/payment/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          packageId,
          orderToken:
            new URLSearchParams(window.location.search).get("order_token") ||
            "",
        }),
      });

      const verifyData = await verifyResponse.json();

      if (verifyResponse.ok && verifyData.success) {
        setMessage(
          `Payment successful! ${verifyData.credits} credits added to your account.`
        );
        await loadCredits();
      } else {
        // Payment not completed, don't show error for cancelled payments
        const paymentStatus = new URLSearchParams(window.location.search).get(
          "payment_status"
        );
        if (paymentStatus !== "cancelled" && paymentStatus !== "failed") {
          setMessage(verifyData.error || "Payment verification failed");
        }
      }
      window.history.replaceState({}, "", "/account");
    } catch (error: any) {
      console.error("Error checking payment status:", error);
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

      if (verifyResponse.ok && verifyData.success) {
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
    const orderId = urlParams.get("orderId");
    const packageId = urlParams.get("packageId");

    // Only verify payment if status is explicitly "success"
    if (paymentStatus === "success" && orderId && packageId) {
      setProcessing(true);
      verifyPayment(orderId, packageId);
    } else if (paymentStatus === "failed" || paymentStatus === "cancelled") {
      // Handle failed or cancelled payments
      setMessage("Payment was cancelled or failed. No credits were added.");
      // Clean up URL
      window.history.replaceState({}, "", "/account");
    } else if (orderId && !paymentStatus) {
      // If orderId exists but no status, check payment status from API
      // This handles cases where user returns without explicit status
      checkPaymentStatus(orderId, packageId || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <div className="flex-1 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-2 sm:px-4">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">My Account</h1>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">
              Purchase Email Credits
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
    </main>
  );
}
