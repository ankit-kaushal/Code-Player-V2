"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  showEmailButton?: boolean;
  showShareButton?: boolean;
  showDownloadButton?: boolean;
  onEmailClick?: () => void;
  onShareClick?: () => void;
  onDownloadClick?: () => void;
  onLoginClick?: () => void;
  shareDisabled?: boolean;
  shareLoading?: boolean;
}

export default function Header({
  showEmailButton = false,
  showShareButton = false,
  showDownloadButton = false,
  onEmailClick,
  onShareClick,
  onDownloadClick,
  onLoginClick,
  shareDisabled = false,
  shareLoading = false,
}: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [userCredits, setUserCredits] = useState<number>(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch user credits
  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) {
        setUserCredits(0);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/user/credits", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserCredits(data.credits || 0);
        }
      } catch (error) {
        console.error("Error fetching credits:", error);
      }
    };

    fetchCredits();
  }, [user]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md z-10">
      <h1 className="text-2xl font-bold">Code Player</h1>
      <div className="flex gap-2 items-center flex-wrap">
        {user ? (
          <>
            {showEmailButton && (
              <button
                onClick={onEmailClick}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
              >
                📧 Creating this for email
              </button>
            )}
            {showShareButton && (
              <button
                onClick={onShareClick}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-sm font-medium"
                disabled={shareDisabled || shareLoading}
              >
                {shareLoading ? "Saving & Sharing..." : "Share"}
              </button>
            )}
            {showDownloadButton && (
              <button
                onClick={onDownloadClick}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
              >
                Download
              </button>
            )}
            {/* User Profile Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                title={user.email}
              >
                {user.email.charAt(0).toUpperCase()}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-800">
                      {user.email}
                    </p>
                  </div>
                  <div className="px-4 py-2 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        Total Tokens:
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {userCredits}
                      </span>
                    </div>
                    {userCredits === 0 && (
                      <a
                        href="/account"
                        onClick={() => setShowUserMenu(false)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 block"
                      >
                        Purchase tokens
                      </a>
                    )}
                  </div>
                  <a
                    href="/account"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Account
                  </a>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            onClick={onLoginClick || (() => router.push("/"))}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}

