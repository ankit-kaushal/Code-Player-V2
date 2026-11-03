"use client";

import React, { useEffect, useState } from "react";

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
}

export default function ShareLinkModal({
  isOpen,
  onClose,
  shareUrl,
}: ShareLinkModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1f1f1f] p-6 sm:p-8 rounded-lg max-w-lg w-full mx-2 sm:mx-4 relative shadow-xl dark:border dark:border-[#2b2b2b]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-4 text-2xl text-gray-600 dark:text-[#8a8a8a] hover:text-black dark:hover:text-[#d4d4d4]"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-[#d4d4d4]">
          Share your code
        </h2>
        <p className="text-sm text-gray-600 dark:text-[#8a8a8a] mb-4">
          Anyone with this link can view your playground.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 p-3 border-2 border-gray-300 dark:border-[#2b2b2b] dark:bg-[#181818] dark:text-[#d4d4d4] rounded text-sm focus:outline-none"
            onFocus={(e) => e.target.select()}
          />
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
