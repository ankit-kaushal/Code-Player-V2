"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

interface HeaderProps {
  showEmailButton?: boolean;
  showShareButton?: boolean;
  showSaveButton?: boolean;
  showDownloadButton?: boolean;
  onEmailClick?: () => void;
  onShareClick?: () => void;
  onSaveClick?: () => void;
  onDownloadClick?: () => void;
  onDownloadOneFile?: () => void;
  onDownloadMultipleFiles?: () => void;
  onDownloadPreviewAsPDF?: () => void;
  onDownloadPreviewAsImage?: () => void;
  onLoginClick?: () => void;
  shareDisabled?: boolean;
  shareLoading?: boolean;
  saveLoading?: boolean;
  showUnsavedHint?: boolean;
}

export default function Header({
  showEmailButton = false,
  showShareButton = false,
  showSaveButton = false,
  showDownloadButton = false,
  onEmailClick,
  onShareClick,
  onSaveClick,
  onDownloadClick,
  onDownloadOneFile,
  onDownloadMultipleFiles,
  onDownloadPreviewAsPDF,
  onDownloadPreviewAsImage,
  onLoginClick,
  shareDisabled = false,
  shareLoading = false,
  saveLoading = false,
  showUnsavedHint = false,
}: HeaderProps) {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const hasSecondaryActions =
    (showEmailButton && !!onEmailClick) || showDownloadButton;

  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) {
        setUserCredits(null);
        setCreditsLoading(false);
        return;
      }

      setCreditsLoading(true);
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
      } finally {
        setCreditsLoading(false);
      }
    };

    if (!authLoading) {
      fetchCredits();
    }
  }, [user, authLoading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
      if (
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(event.target as Node)
      ) {
        setShowDownloadMenu(false);
      }
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setShowMoreMenu(false);
      }
    };

    if (showUserMenu || showDownloadMenu || showMoreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu, showDownloadMenu, showMoreMenu]);

  const downloadMenuItems = (
    <>
      {onDownloadOneFile && (
        <button
          onClick={() => {
            setShowDownloadMenu(false);
            setShowMoreMenu(false);
            onDownloadOneFile();
          }}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-[#d4d4d4] hover:bg-gray-100 dark:hover:bg-[#2b2b2b] flex items-center gap-2"
        >
          <span>📄</span>
          <span className="flex-1">Download as one file</span>
        </button>
      )}
      {onDownloadMultipleFiles && (
        <button
          onClick={() => {
            setShowDownloadMenu(false);
            setShowMoreMenu(false);
            onDownloadMultipleFiles();
          }}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-[#d4d4d4] hover:bg-gray-100 dark:hover:bg-[#2b2b2b] flex items-center gap-2"
        >
          <span>📁</span>
          <span className="flex-1">Download as multiple files</span>
        </button>
      )}
      {onDownloadPreviewAsPDF && (
        <button
          onClick={() => {
            setShowDownloadMenu(false);
            setShowMoreMenu(false);
            onDownloadPreviewAsPDF();
          }}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-[#d4d4d4] hover:bg-gray-100 dark:hover:bg-[#2b2b2b] flex items-center gap-2"
        >
          <span>📄</span>
          <span className="flex-1">Download preview as PDF</span>
        </button>
      )}
      {onDownloadPreviewAsImage && (
        <button
          onClick={() => {
            setShowDownloadMenu(false);
            setShowMoreMenu(false);
            onDownloadPreviewAsImage();
          }}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-[#d4d4d4] hover:bg-gray-100 dark:hover:bg-[#2b2b2b] flex items-center gap-2"
        >
          <span>🖼️</span>
          <span className="flex-1">Download preview as image</span>
        </button>
      )}
      {onDownloadClick && !onDownloadOneFile && (
        <button
          onClick={() => {
            setShowDownloadMenu(false);
            setShowMoreMenu(false);
            onDownloadClick();
          }}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-[#d4d4d4] hover:bg-gray-100 dark:hover:bg-[#2b2b2b] flex items-center gap-2"
        >
          <span>📥</span>
          <span>Download</span>
        </button>
      )}
    </>
  );

  return (
    <header
      role="banner"
      className="bg-gray-800 dark:bg-[#181818] dark:border-b dark:border-[#2b2b2b] text-white px-2 py-2 sm:p-4 flex items-center justify-between gap-2 shadow-md dark:shadow-none z-10 flex-shrink-0"
    >
      <Link
        href="/"
        className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-shrink-0"
        aria-label="Code Player Home"
      >
        <Image
          src="/logo.png"
          alt="Code Player - Online HTML, CSS & JavaScript Editor"
          width={120}
          height={120}
          className="w-16 sm:w-20 md:w-auto h-auto"
          priority
        />
      </Link>
      <div className="flex gap-1.5 sm:gap-2 items-center justify-end min-w-0 flex-1">
        {showUnsavedHint && (
          <span className="hidden sm:inline text-xs text-amber-300 max-w-[200px] text-right leading-tight">
            Code not saved yet — save or you may lose it
          </span>
        )}
        <button
          type="button"
          onClick={toggleTheme}
          className="min-w-[36px] min-h-[36px] px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-700 dark:bg-[#2b2b2b] text-white dark:text-[#d4d4d4] rounded hover:bg-gray-600 dark:hover:bg-[#333333] text-xs sm:text-sm font-medium border border-transparent dark:border-[#3a3a3a] flex items-center justify-center"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        {!authLoading && user ? (
          <>
            {/* Desktop: Email */}
            {showEmailButton && (
              <button
                onClick={onEmailClick}
                className="hidden md:inline-flex px-3 lg:px-4 py-1.5 sm:py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs sm:text-sm font-medium"
              >
                📧 Creating this for email
              </button>
            )}
            {showSaveButton && (
              <button
                onClick={onSaveClick}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-xs sm:text-sm font-medium"
                disabled={shareDisabled || saveLoading}
              >
                {saveLoading ? "Saving..." : "Save"}
              </button>
            )}
            {showShareButton && (
              <button
                onClick={onShareClick}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-xs sm:text-sm font-medium"
                disabled={shareDisabled || shareLoading}
              >
                Share
              </button>
            )}
            {/* Desktop: Download */}
            {showDownloadButton && (
              <div className="relative hidden md:block" ref={downloadMenuRef}>
                <button
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  className="px-3 lg:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs sm:text-sm font-medium flex items-center gap-2"
                >
                  <span>Download</span>
                  <span className="h-3 w-px bg-white/50"></span>
                  <span className="text-xs">
                    {showDownloadMenu ? "▲" : "▼"}
                  </span>
                </button>
                {showDownloadMenu && (
                  <div className="absolute right-0 mt-2 min-w-[220px] max-w-[calc(100vw-1rem)] bg-white dark:bg-[#1f1f1f] rounded-lg shadow-lg border border-gray-200 dark:border-[#2b2b2b] py-2 z-50">
                    {downloadMenuItems}
                  </div>
                )}
              </div>
            )}
            {/* Mobile: More menu for Email + Download */}
            {hasSecondaryActions && (
              <div className="relative md:hidden" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="min-w-[36px] min-h-[36px] px-2.5 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
                  aria-label="More actions"
                  aria-expanded={showMoreMenu}
                >
                  ⋯
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1rem)] bg-white dark:bg-[#1f1f1f] rounded-lg shadow-lg border border-gray-200 dark:border-[#2b2b2b] py-2 z-50">
                    {showEmailButton && onEmailClick && (
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          onEmailClick();
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-[#d4d4d4] hover:bg-gray-100 dark:hover:bg-[#2b2b2b]"
                      >
                        📧 Send as email
                      </button>
                    )}
                    {showDownloadButton && (
                      <>
                        {showEmailButton && onEmailClick && (
                          <div className="border-t border-gray-200 dark:border-[#2b2b2b] my-1" />
                        )}
                        <p className="px-4 py-1 text-[11px] uppercase tracking-wide text-gray-400 dark:text-[#8a8a8a]">
                          Download
                        </p>
                        {downloadMenuItems}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                title={user.email}
              >
                {user.email.charAt(0).toUpperCase()}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1rem)] bg-white dark:bg-[#1f1f1f] rounded-lg shadow-lg border border-gray-200 dark:border-[#2b2b2b] py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-[#2b2b2b]">
                    <p className="text-sm font-semibold text-gray-800 dark:text-[#d4d4d4] break-all">
                      {user.email}
                    </p>
                  </div>
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-[#2b2b2b]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-gray-700 dark:text-[#8a8a8a]">
                        Total Tokens:
                      </span>
                      {creditsLoading ? (
                        <div
                          className="loader text-sm"
                          style={{ fontSize: "14px" }}
                        ></div>
                      ) : (
                        <span className="text-sm font-semibold text-gray-900 dark:text-[#d4d4d4]">
                          {userCredits ?? 0}
                        </span>
                      )}
                    </div>
                    {!creditsLoading && userCredits === 0 && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          router.push("/account");
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 block text-left w-full"
                      >
                        Purchase tokens
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push("/account");
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-[#d4d4d4] hover:bg-gray-100 dark:hover:bg-[#2b2b2b]"
                  >
                    Account
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-[#2b2b2b]"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : !authLoading ? (
          <button
            onClick={onLoginClick || (() => router.push("/"))}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs sm:text-sm font-medium"
          >
            Login
          </button>
        ) : null}
      </div>
    </header>
  );
}
