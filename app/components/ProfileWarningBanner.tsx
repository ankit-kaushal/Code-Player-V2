"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

const PROFILE_WARNING_DISMISSED_KEY = "profile_warning_dismissed";
const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 1 day in milliseconds

export default function ProfileWarningBanner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.pathname === "/account"
    ) {
      setShowWarning(false);
      return;
    }

    if (authLoading || !user) {
      setShowWarning(false);
      return;
    }

    const isMissingInfo = !user.name || !user.phone;

    if (!isMissingInfo) {
      setShowWarning(false);
      return;
    }

    const dismissedTimestamp = localStorage.getItem(
      PROFILE_WARNING_DISMISSED_KEY
    );

    if (dismissedTimestamp) {
      const dismissedTime = parseInt(dismissedTimestamp, 10);
      const now = Date.now();
      const timeSinceDismissal = now - dismissedTime;

      if (timeSinceDismissal < ONE_DAY_MS) {
        setShowWarning(false);
        return;
      }
    }

    setShowWarning(true);
  }, [user, authLoading]);

  const handleDismiss = () => {
    localStorage.setItem(PROFILE_WARNING_DISMISSED_KEY, Date.now().toString());
    setShowWarning(false);
  };

  const handleUpdateProfile = () => {
    router.push("/account");
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div
      className="text-white px-4 py-2.5 flex items-center justify-center gap-4 z-20 relative"
      style={{ backgroundColor: "#d43d4f" }}
    >
      <div className="flex items-center gap-3 flex-1 justify-center">
        <span className="text-center" style={{ fontSize: "12px" }}>
          Please complete your profile by adding your name and phone number in
          your{" "}
          <button
            onClick={handleUpdateProfile}
            className="underline font-semibold hover:text-red-100 transition-colors"
          >
            account settings
          </button>
        </span>
      </div>
      <button
        onClick={handleDismiss}
        className="text-white hover:text-red-100 font-bold text-lg leading-none flex-shrink-0 transition-colors"
        aria-label="Dismiss warning"
      >
        ×
      </button>
    </div>
  );
}
