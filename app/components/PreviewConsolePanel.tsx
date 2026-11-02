"use client";

import React, { RefObject, useCallback, useEffect, useRef, useState } from "react";
import Preview, { PreviewHandle } from "./Preview";
import Console from "./Console";
import { LayoutMode } from "@/lib/layout-prefs";

interface ConsoleLog {
  type: string;
  message: string;
  timestamp: string;
}

interface PreviewConsolePanelProps {
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
  splitPreviewPercent: number;
  onSplitPreviewPercentChange: (percent: number) => void;
  html: string;
  css: string;
  js: string;
  consoleLogs: ConsoleLog[];
  shouldRunCode: boolean;
  previewRef?: RefObject<PreviewHandle>;
  onConsoleLog: (logs: any[]) => void;
  onRun: () => void;
  onClear: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function PreviewConsolePanel({
  layoutMode,
  onLayoutModeChange,
  splitPreviewPercent,
  onSplitPreviewPercentChange,
  html,
  css,
  js,
  consoleLogs,
  shouldRunCode,
  previewRef,
  onConsoleLog,
  onRun,
  onClear,
  className = "",
  style,
}: PreviewConsolePanelProps) {
  const panelBodyRef = useRef<HTMLDivElement>(null);
  const splitPreviewPercentRef = useRef(splitPreviewPercent);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  useEffect(() => {
    splitPreviewPercentRef.current = splitPreviewPercent;
  }, [splitPreviewPercent]);

  const tabClass = (mode: LayoutMode) =>
    `px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap ${
      layoutMode === mode
        ? "bg-white dark:bg-[#1f1f1f] border-b-2 border-blue-600 dark:border-[#aed8aa] text-blue-600 dark:text-[#aed8aa]"
        : "text-gray-600 dark:text-[#8a8a8a] hover:text-gray-800 dark:hover:text-[#d4d4d4]"
    }`;

  const startSplitDrag = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const panel = panelBodyRef.current;
      if (!panel) return;

      setIsDraggingSplit(true);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";

      const onMove = (e: MouseEvent) => {
        const rect = panel.getBoundingClientRect();
        if (rect.height <= 0) return;
        const next = ((e.clientY - rect.top) / rect.height) * 100;
        // Preview 20–80% so console can grow/shrink freely either direction
        const clamped = Math.max(20, Math.min(80, next));
        if (Math.abs(clamped - splitPreviewPercentRef.current) < 0.2) return;
        onSplitPreviewPercentChange(clamped);
      };

      const onUp = () => {
        setIsDraggingSplit(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [onSplitPreviewPercentChange]
  );

  return (
    <div
      className={`border border-gray-300 dark:border-[#2b2b2b] rounded flex flex-col min-h-0 overflow-hidden dark:bg-[#181818] ${className}`}
      style={style}
    >
      <div className="flex border-b border-gray-300 dark:border-[#2b2b2b] bg-gray-100 dark:bg-[#2b2b2b] flex-shrink-0">
        <button
          type="button"
          onClick={() => onLayoutModeChange("preview")}
          className={tabClass("preview")}
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => onLayoutModeChange("console")}
          className={tabClass("console")}
        >
          Console ({consoleLogs.length})
        </button>
        <button
          type="button"
          onClick={() => onLayoutModeChange("split")}
          className={tabClass("split")}
          title="Show preview and console together"
        >
          Both
        </button>
      </div>

      <div
        ref={panelBodyRef}
        className="flex-1 min-h-0 relative overflow-hidden"
      >
        {layoutMode === "split" ? (
          <div className="absolute inset-0 flex flex-col min-h-0">
            <div
              className="min-h-0 overflow-hidden relative"
              style={{
                flex: `0 0 ${splitPreviewPercent}%`,
                // Prevent iframe from swallowing drag events when resizing
                pointerEvents: isDraggingSplit ? "none" : "auto",
              }}
            >
              <Preview
                ref={previewRef}
                html={html}
                css={css}
                js={js}
                onConsoleLog={onConsoleLog}
                shouldRun={shouldRunCode}
                compact
              />
            </div>
            <div
              role="separator"
              aria-orientation="horizontal"
              aria-label="Resize preview and console"
              onMouseDown={startSplitDrag}
              className={`h-2 flex-shrink-0 cursor-row-resize bg-gray-300 dark:bg-[#3a3a3a] hover:bg-blue-500 dark:hover:bg-[#aed8aa] transition-colors z-20 ${
                isDraggingSplit ? "bg-blue-500 dark:bg-[#aed8aa]" : ""
              }`}
            />
            <div
              className="flex-1 min-h-0 overflow-hidden"
              style={{
                pointerEvents: isDraggingSplit ? "none" : "auto",
              }}
            >
              <Console
                logs={consoleLogs}
                onRun={onRun}
                onClear={onClear}
                compact
              />
            </div>
            {isDraggingSplit && (
              <div className="absolute inset-0 z-10 cursor-row-resize" />
            )}
          </div>
        ) : (
          <>
            <div
              className={`absolute inset-0 w-full h-full ${
                layoutMode === "preview" ? "block" : "hidden"
              }`}
            >
              <Preview
                ref={previewRef}
                html={html}
                css={css}
                js={js}
                onConsoleLog={onConsoleLog}
                shouldRun={shouldRunCode}
              />
            </div>
            <div
              className={`absolute inset-0 w-full h-full ${
                layoutMode === "console" ? "block" : "hidden"
              }`}
            >
              <Console logs={consoleLogs} onRun={onRun} onClear={onClear} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
