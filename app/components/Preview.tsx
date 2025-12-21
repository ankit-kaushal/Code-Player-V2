"use client";

import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";

interface PreviewProps {
  html: string;
  css: string;
  js: string;
  onConsoleLog?: (logs: any[]) => void;
  shouldRun?: boolean;
  captureConsole?: boolean;
}

export interface PreviewHandle {
  runCode: () => void;
  clearLogs: () => void;
}

const Preview = forwardRef<PreviewHandle, PreviewProps>(
  (
    { html, css, js, onConsoleLog, shouldRun = false, captureConsole = false },
    ref
  ) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const logsRef = useRef<any[]>([]);
    const captureConsoleRef = useRef<boolean>(false);
    const isManualExecutingRef = useRef<boolean>(false);
    const executionIdRef = useRef<number>(0);

    const runCode = useCallback(
      (captureLogs: boolean = false) => {
        if (iframeRef.current) {
          const iframe = iframeRef.current;

          // Update capture flag
          captureConsoleRef.current = captureLogs;

          // Wait for iframe to be ready
          const executeCode = () => {
            try {
              const doc =
                iframe.contentDocument || iframe.contentWindow?.document;
              if (!doc) {
                // Retry after a short delay if document isn't ready
                setTimeout(executeCode, 50);
                return;
              }

              // When capturing, logs are already cleared in the ref's runCode function
              // Just use the current execution ID
              const currentExecutionId = captureLogs
                ? executionIdRef.current
                : 0;

              doc.open();
              doc.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <style>${css || ""}</style>
                <script>
                  (function() {
                    const originalLog = console.log;
                    const originalError = console.error;
                    const originalWarn = console.warn;
                    const originalInfo = console.info;
                    
                    const shouldCapture = ${captureLogs};
                    const executionId = ${currentExecutionId};
                    
                    function sendLog(type, ...args) {
                      if (shouldCapture) {
                        window.parent.postMessage({
                          type: 'console',
                          logType: type,
                          executionId: executionId,
                          message: args.map(arg => {
                            if (typeof arg === 'object') {
                              try {
                                return JSON.stringify(arg, null, 2);
                              } catch (e) {
                                return String(arg);
                              }
                            }
                            return String(arg);
                          }).join(' ')
                        }, '*');
                      }
                    }
                    
                    console.log = function(...args) {
                      originalLog.apply(console, args);
                      sendLog('log', ...args);
                    };
                    
                    console.error = function(...args) {
                      originalError.apply(console, args);
                      sendLog('error', ...args);
                    };
                    
                    console.warn = function(...args) {
                      originalWarn.apply(console, args);
                      sendLog('warn', ...args);
                    };
                    
                    console.info = function(...args) {
                      originalInfo.apply(console, args);
                      sendLog('info', ...args);
                    };
                  })();
                </script>
              </head>
              <body>
                ${html || ""}
                <script>${js || ""}</script>
              </body>
            </html>
          `);
              doc.close();
            } catch (error) {
              console.error("Error executing code in preview:", error);
              // Retry after a short delay
              setTimeout(executeCode, 100);
            }
          };

          executeCode();
        }
      },
      [html, css, js, onConsoleLog]
    );

    // Set up message listener once on mount (only captures when captureConsoleRef is true)
    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        if (
          event.data &&
          event.data.type === "console" &&
          captureConsoleRef.current
        ) {
          // Only process messages from the current execution
          if (event.data.executionId === executionIdRef.current) {
            const newLog = {
              type: event.data.logType,
              message: event.data.message,
              timestamp: new Date().toLocaleTimeString(),
            };
            logsRef.current.push(newLog);
            // Create a new array to trigger React state update
            onConsoleLog?.([...logsRef.current]);
          }
        }
      };

      window.addEventListener("message", handleMessage);

      return () => {
        window.removeEventListener("message", handleMessage);
      };
    }, [onConsoleLog]);

    // Initialize iframe with empty content on mount
    useEffect(() => {
      if (iframeRef.current) {
        const iframe = iframeRef.current;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write("<!DOCTYPE html><html><head></head><body></body></html>");
          doc.close();
        }
      }
    }, []);

    // Track if we're manually running to prevent auto-run interference
    const isManualRunRef = useRef<boolean>(false);

    // Run code automatically when html, css, or js changes (without capturing console)
    useEffect(() => {
      // Skip auto-run if we're in the middle of a manual run
      if (iframeRef.current && !isManualRunRef.current) {
        runCode(false);
      }
    }, [html, css, js, runCode]);

    // Run with console capture when shouldRun is explicitly set to true (for manual run button)
    // This is a fallback - prefer using the ref directly
    useEffect(() => {
      if (shouldRun && iframeRef.current) {
        isManualRunRef.current = true;
        runCode(true);
        // Reset flag after a short delay
        setTimeout(() => {
          isManualRunRef.current = false;
        }, 100);
      }
    }, [shouldRun, runCode]);

    // Expose runCode and clearLogs functions via ref for parent to call
    useImperativeHandle(
      ref,
      () => ({
        runCode: () => {
          // Prevent duplicate manual runs
          if (isManualExecutingRef.current) {
            return;
          }

          isManualExecutingRef.current = true;
          // Set manual run flag to prevent auto-run interference
          isManualRunRef.current = true;
          // Increment execution ID to filter out any pending messages from previous runs
          // Don't clear logs - let new logs accumulate with existing ones
          executionIdRef.current += 1;
          const currentExecutionId = executionIdRef.current;
          // Ensure capture flag is set before running
          captureConsoleRef.current = true;
          // Add a small delay to ensure iframe is ready (especially when hidden)
          setTimeout(() => {
            // Verify execution ID hasn't changed (shouldn't, but just in case)
            if (executionIdRef.current === currentExecutionId) {
              runCode(true);
            }
            // Reset flags after execution
            setTimeout(() => {
              isManualRunRef.current = false;
              isManualExecutingRef.current = false;
            }, 100);
          }, 10);
        },
        clearLogs: () => {
          logsRef.current = [];
          if (onConsoleLog) {
            onConsoleLog([]);
          }
          // Increment execution ID to ignore any pending messages
          executionIdRef.current += 1;
        },
      }),
      [runCode, onConsoleLog]
    );

    return (
      <div className="flex flex-col h-full w-full border border-gray-300 rounded overflow-hidden">
        <div className="bg-gray-100 px-3 py-2 border-b border-gray-300 text-xs font-bold text-gray-600 flex-shrink-0">
          Preview
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          <iframe
            ref={iframeRef}
            title="preview"
            className="w-full h-full border-none bg-white"
            sandbox="allow-scripts allow-same-origin"
            style={{ display: "block", minHeight: "100%" }}
          />
        </div>
      </div>
    );
  }
);

Preview.displayName = "Preview";

export default Preview;
