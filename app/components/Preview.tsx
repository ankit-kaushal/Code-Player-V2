'use client';

import React, { useEffect, useRef } from 'react';

interface PreviewProps {
  html: string;
  css: string;
  js: string;
  onConsoleLog?: (logs: any[]) => void;
}

const Preview: React.FC<PreviewProps> = ({ html, css, js, onConsoleLog }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (!doc) return;

      // Set up message listener for console logs from iframe
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'console') {
          logs.push({
            type: event.data.logType,
            message: event.data.message,
            timestamp: new Date().toLocaleTimeString()
          });
          onConsoleLog?.(logs);
        }
      };

      window.addEventListener('message', handleMessage);

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>${css || ''}</style>
            <script>
              (function() {
                const originalLog = console.log;
                const originalError = console.error;
                const originalWarn = console.warn;
                const originalInfo = console.info;
                
                function sendLog(type, ...args) {
                  window.parent.postMessage({
                    type: 'console',
                    logType: type,
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
            ${html || ''}
            <script>${js || ''}</script>
          </body>
        </html>
      `);
      doc.close();

      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }
  }, [html, css, js, onConsoleLog]);

  return (
    <div className="flex flex-col h-full border border-gray-300 rounded overflow-hidden">
      <div className="bg-gray-100 px-3 py-2 border-b border-gray-300 text-xs font-bold text-gray-600">
        Preview
      </div>
      <iframe
        ref={iframeRef}
        title="preview"
        className="flex-1 w-full border-none bg-white"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default Preview;

