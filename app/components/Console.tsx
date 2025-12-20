"use client";

import React, { useEffect, useRef } from "react";

interface ConsoleLog {
  type: string;
  message: string;
  timestamp: string;
}

interface ConsoleProps {
  logs: ConsoleLog[];
}

const Console: React.FC<ConsoleProps> = ({ logs }) => {
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (type: string) => {
    switch (type) {
      case "error":
        return "text-red-600";
      case "warn":
        return "text-yellow-600";
      case "info":
        return "text-blue-600";
      default:
        return "text-gray-800";
    }
  };

  const getLogBg = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-50";
      case "warn":
        return "bg-yellow-50";
      case "info":
        return "bg-blue-50";
      default:
        return "bg-white";
    }
  };

  return (
    <div className="flex flex-col h-full border border-gray-300 rounded overflow-hidden">
      <div className="bg-gray-100 px-3 py-2 border-b border-gray-300 text-xs font-bold text-gray-600">
        Console
      </div>
      <div
        ref={consoleRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-900 text-sm font-mono"
        style={{ minHeight: 0 }}
      >
        {logs.length === 0 ? (
          <div className="text-gray-500 italic">No console output yet...</div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`mb-1 p-2 rounded ${getLogBg(log.type)} ${getLogColor(
                log.type
              )}`}
            >
              <span className="text-gray-400 text-xs mr-2">
                [{log.timestamp}]
              </span>
              <span className="font-semibold mr-2">
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
