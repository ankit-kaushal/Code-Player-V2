"use client";

import React, { useEffect, useRef } from "react";

interface ConsoleLog {
  type: string;
  message: string;
  timestamp: string;
}

interface ConsoleProps {
  logs: ConsoleLog[];
  onRun?: () => void;
  onClear?: () => void;
  compact?: boolean;
}

const Console: React.FC<ConsoleProps> = ({
  logs,
  onRun,
  onClear,
  compact = false,
}) => {
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (type: string) => {
    switch (type) {
      case "error":
        return "text-red-600 dark:text-[#f48771]";
      case "warn":
        return "text-yellow-600 dark:text-[#dcdcaa]";
      case "info":
        return "text-blue-600 dark:text-[#9cdcfe]";
      default:
        return "text-gray-800 dark:text-[#aed8aa]";
    }
  };

  const getLogBg = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-50 dark:bg-transparent";
      case "warn":
        return "bg-yellow-50 dark:bg-transparent";
      case "info":
        return "bg-blue-50 dark:bg-transparent";
      default:
        return "bg-white dark:bg-transparent";
    }
  };

  return (
    <div
      className={`flex flex-col h-full w-full overflow-hidden ${
        compact ? "" : "border border-gray-300 dark:border-[#2b2b2b] rounded"
      }`}
    >
      <div className="bg-gray-100 dark:bg-[#2b2b2b] px-3 py-2 border-b border-gray-300 dark:border-[#2b2b2b] flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-bold text-gray-600 dark:text-[#8a8a8a]">
          Console
        </span>
        <div className="flex gap-2">
          {onClear && (
            <button
              onClick={onClear}
              className="px-3 py-1 text-xs bg-gray-500 dark:bg-[#3a3a3a] text-white dark:text-[#d4d4d4] rounded hover:bg-gray-600 dark:hover:bg-[#444444] font-semibold"
            >
              Clear
            </button>
          )}
          {onRun && (
            <button
              onClick={onRun}
              className="px-3 py-1 text-xs bg-green-500 dark:bg-[#3d7a3d] text-white rounded hover:bg-green-600 dark:hover:bg-[#4a944a] font-semibold"
            >
              ▶ Run
            </button>
          )}
        </div>
      </div>
      <div
        ref={consoleRef}
        className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 bg-gray-900 dark:bg-[#181818] text-sm font-mono"
      >
        {logs.length === 0 ? (
          <div className="text-gray-500 dark:text-[#6a6a6a] italic">
            No console output yet...
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`mb-1 p-2 rounded dark:p-0.5 dark:mb-0.5 ${getLogBg(
                log.type
              )} ${getLogColor(log.type)}`}
            >
              <span className="text-gray-400 dark:text-[#555555] text-xs mr-2">
                [{log.timestamp}]
              </span>
              <span className="font-semibold mr-2 dark:font-normal">
                {log.type === "error" && "❌"}
                {log.type === "warn" && "⚠️"}
                {log.type === "info" && "ℹ️"}
                {log.type === "log" && "📝"}
              </span>
              <span className="whitespace-pre-wrap break-words">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Console;
