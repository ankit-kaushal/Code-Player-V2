"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import CodeEditor from "../components/CodeEditor";
import Preview, { PreviewHandle } from "../components/Preview";
import Console from "../components/Console";
import LoginModal from "../components/LoginModal";
import EmailModal from "../components/EmailModal";

interface ConsoleLog {
  type: string;
  message: string;
  timestamp: string;
}

export default function SharedCodePage() {
  const params = useParams();
  const router = useRouter();
  const shareId = params.id as string;
  const { user, login, logout } = useAuth();
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [js, setJs] = useState("");
  const [canEdit, setCanEdit] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [activeTab, setActiveTab] = useState<"preview" | "console">("preview");
  const [shouldRunCode, setShouldRunCode] = useState(false);
  const previewRef = React.useRef<PreviewHandle>(null);
  const [loading, setLoading] = useState(true);

  // Collapsible states
  const [htmlCollapsed, setHtmlCollapsed] = useState(false);
  const [cssCollapsed, setCssCollapsed] = useState(false);
  const [jsCollapsed, setJsCollapsed] = useState(false);

  // Resizable widths
  const [htmlWidth, setHtmlWidth] = useState(25);
  const [cssWidth, setCssWidth] = useState(25);
  const [jsWidth, setJsWidth] = useState(25);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    x: number;
    htmlWidth: number;
    cssWidth: number;
    jsWidth: number;
  } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const checkCanEdit = useCallback(async () => {
    if (!user || !shareId) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/code/shared/${shareId}/can-edit`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCanEdit(data.canEdit);
      }
    } catch (error) {
      console.error("Error checking edit permissions:", error);
    }
  }, [user, shareId]);

  useEffect(() => {
    if (shareId) {
      loadSharedCode(shareId);
    }
  }, [shareId]);

  useEffect(() => {
    const checkPermissions = async () => {
      if (shareId && user) {
        await checkCanEdit();
      } else if (shareId && !user) {
        setCanEdit(false);
      } else {
        setCanEdit(true);
      }
    };
    checkPermissions();
  }, [shareId, user, checkCanEdit]);

  // Reset widths to equal when editors are collapsed/expanded
  useEffect(() => {
    const visibleEditors = [!htmlCollapsed, !cssCollapsed, !jsCollapsed].filter(
      Boolean
    ).length;

    if (visibleEditors === 0) {
      return;
    }

    // When editors are collapsed or expanded, divide equally
    const equalWidth = 25; // 25% each for 3 editors, preview gets 25%
    if (!htmlCollapsed && htmlWidth !== equalWidth) setHtmlWidth(equalWidth);
    if (!cssCollapsed && cssWidth !== equalWidth) setCssWidth(equalWidth);
    if (!jsCollapsed && jsWidth !== equalWidth) setJsWidth(equalWidth);
  }, [htmlCollapsed, cssCollapsed, jsCollapsed]); // Only depend on collapsed states

  // Handle resizing - each handle only affects adjacent editors
  useEffect(() => {
    if (!isResizing || !containerRef.current || !resizeStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const deltaX = e.clientX - resizeStart.x;
      const deltaPercentage = (deltaX / containerWidth) * 100;

      if (isResizing === "html") {
        // HTML resize handle (right side) - affects HTML and CSS only
        if (!htmlCollapsed && !cssCollapsed) {
          const newHtmlWidth = Math.max(
            10,
            Math.min(60, resizeStart.htmlWidth + deltaPercentage)
          );
          const newCssWidth = Math.max(
            10,
            resizeStart.cssWidth - deltaPercentage
          );
          setHtmlWidth(newHtmlWidth);
          setCssWidth(newCssWidth);
        }
      } else if (isResizing === "css") {
        // CSS resize handle (right side) - affects CSS and JS only
        if (!cssCollapsed && !jsCollapsed) {
          const newCssWidth = Math.max(
            10,
            Math.min(60, resizeStart.cssWidth + deltaPercentage)
          );
          const newJsWidth = Math.max(
            10,
            resizeStart.jsWidth - deltaPercentage
          );
          setCssWidth(newCssWidth);
          setJsWidth(newJsWidth);
        }
      } else if (isResizing === "js") {
        // JS resize handle (between JS and Preview) - affects JS and Preview
        // Moving right increases JS, moving left decreases JS (increases preview)
        if (!jsCollapsed) {
          const newJsWidth = Math.max(
            10,
            Math.min(60, resizeStart.jsWidth + deltaPercentage)
          );
          setJsWidth(newJsWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      setResizeStart(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, resizeStart, htmlCollapsed, cssCollapsed, jsCollapsed]);

  const loadSharedCode = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/code/shared/${id}`);
      if (!response.ok) {
        throw new Error("Failed to load code");
      }
      const code = await response.json();
      setHtml(code.html || "");
      setCss(code.css || "");
      setJs(code.js || "");

      if (user) {
        checkCanEdit();
      } else {
        setCanEdit(false);
      }
    } catch (error) {
      console.error("Error loading shared code:", error);
      alert("Failed to load shared code");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      // Save the code first
      const response = await fetch("/api/code/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ html, css, js, shareId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save");
      }

      const newShareId = data.shareId;

      // Replace URL with /[id] format
      const newUrl = `/${newShareId}`;
      router.push(newUrl);
      window.history.replaceState({}, "", newUrl);

      const shareUrl = `${window.location.origin}${newUrl}`;
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          setMessage("Code saved and share link copied to clipboard!");
          setTimeout(() => setMessage(""), 3000);
        })
        .catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement("textarea");
          textArea.value = shareUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          setMessage("Code saved and share link copied to clipboard!");
          setTimeout(() => setMessage(""), 3000);
        });
    } catch (error: any) {
      setMessage("Failed to save and share code");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    const content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Player Export</title>
    <style>
${css || "/* No CSS */"}
    </style>
</head>
<body>
${html || "<!-- No HTML -->"}
    <script>
${js || "// No JavaScript"}
    </script>
</body>
</html>`;

    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "code-player-export.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEmailClick = () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsEmailModalOpen(true);
  };

  const handleLoginSuccess = (
    token: string,
    userData: { userId: string; email: string }
  ) => {
    login(token, userData);
    if (shareId) {
      checkCanEdit();
    }
  };

  const handleConsoleLog = (logs: ConsoleLog[]) => {
    setConsoleLogs([...logs]);
  };

  const handleRunCode = () => {
    setConsoleLogs([]);
    // Always try to use the ref first
    if (previewRef.current) {
      try {
        previewRef.current.runCode();
      } catch (error) {
        console.error('Error running code via ref:', error);
        // Fallback: trigger via shouldRunCode state
        setShouldRunCode(true);
        setTimeout(() => setShouldRunCode(false), 100);
      }
    } else {
      // Fallback: trigger via shouldRunCode state
      setShouldRunCode(true);
      setTimeout(() => setShouldRunCode(false), 100);
    }
  };

  const handleClearConsole = () => {
    setConsoleLogs([]);
  };

  // Calculate widths based on collapsed state and user-defined widths
  const calculateWidths = () => {
    const visibleEditors = [!htmlCollapsed, !cssCollapsed, !jsCollapsed].filter(
      Boolean
    ).length;

    if (visibleEditors === 0) {
      return { htmlWidth: 0, cssWidth: 0, jsWidth: 0, previewWidth: 100 };
    }

    // Use actual width states if editors are visible, otherwise 0
    const actualHtmlWidth = htmlCollapsed ? 0 : htmlWidth;
    const actualCssWidth = cssCollapsed ? 0 : cssWidth;
    const actualJsWidth = jsCollapsed ? 0 : jsWidth;

    const totalEditorWidth = actualHtmlWidth + actualCssWidth + actualJsWidth;
    const previewWidth = 100 - totalEditorWidth;

    return {
      htmlWidth: actualHtmlWidth,
      cssWidth: actualCssWidth,
      jsWidth: actualJsWidth,
      previewWidth: Math.max(10, previewWidth), // Minimum width for preview
    };
  };

  const {
    htmlWidth: calcHtmlWidth,
    cssWidth: calcCssWidth,
    jsWidth: calcJsWidth,
    previewWidth,
  } = calculateWidths();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md z-10">
        <h1 className="text-2xl font-bold">Code Player</h1>
        <div className="flex gap-2 items-center flex-wrap">
          {user ? (
            <>
              <span className="text-gray-300 text-sm mr-2">{user.email}</span>
              <button
                onClick={handleEmailClick}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
              >
                📧 Creating this for email
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-sm font-medium"
                disabled={saving || !canEdit}
              >
                {saving ? "Saving & Sharing..." : "Share"}
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
              >
                Download
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-sm font-medium"
                disabled={saving || !canEdit}
              >
                {saving ? "Saving & Sharing..." : "Share"}
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
              >
                Download
              </button>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
              >
                Login
              </button>
            </>
          )}
        </div>
      </header>

      {message && (
        <div className="bg-green-500 text-white px-4 py-2 text-center text-sm">
          {message}
        </div>
      )}

      {shareId && !canEdit && (
        <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm">
          You are viewing a shared code. Login to edit.
        </div>
      )}

      <div className="flex-1 flex relative min-h-0">
        {/* Collapsed Editors Sidebar */}
        {(htmlCollapsed || cssCollapsed || jsCollapsed) && (
          <div className="w-16 bg-gray-200 border-r border-gray-300 flex flex-col items-center py-3 gap-2 flex-shrink-0">
            {htmlCollapsed && (
              <button
                onClick={() => setHtmlCollapsed(false)}
                className="px-2 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 shadow w-12"
                title="Reopen HTML Editor"
              >
                HTML
              </button>
            )}
            {cssCollapsed && (
              <button
                onClick={() => setCssCollapsed(false)}
                className="px-2 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 shadow w-12"
                title="Reopen CSS Editor"
              >
                CSS
              </button>
            )}
            {jsCollapsed && (
              <button
                onClick={() => setJsCollapsed(false)}
                className="px-2 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 shadow w-12"
                title="Reopen JavaScript Editor"
              >
                JS
              </button>
            )}
          </div>
        )}

        <div
          ref={containerRef}
          className="flex-1 flex gap-2 p-2 min-h-0"
          style={{ position: "relative" }}
        >
          {/* HTML Editor */}
          {!htmlCollapsed && (
            <>
              <div className="min-h-0" style={{ width: `${calcHtmlWidth}%` }}>
                <CodeEditor
                  language="html"
                  value={html}
                  onChange={setHtml}
                  readOnly={!canEdit}
                  isCollapsed={htmlCollapsed}
                  onToggleCollapse={() => setHtmlCollapsed(true)}
                />
              </div>
              <div
                className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (containerRef.current) {
                    setResizeStart({
                      x: e.clientX,
                      htmlWidth: calcHtmlWidth,
                      cssWidth: calcCssWidth,
                      jsWidth: calcJsWidth,
                    });
                    setIsResizing("html");
                  }
                }}
                style={{ minWidth: "4px" }}
              />
            </>
          )}

          {/* CSS Editor */}
          {!cssCollapsed && (
            <>
              <div className="min-h-0" style={{ width: `${calcCssWidth}%` }}>
                <CodeEditor
                  language="css"
                  value={css}
                  onChange={setCss}
                  readOnly={!canEdit}
                  isCollapsed={cssCollapsed}
                  onToggleCollapse={() => setCssCollapsed(true)}
                />
              </div>
              <div
                className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (containerRef.current) {
                    setResizeStart({
                      x: e.clientX,
                      htmlWidth: calcHtmlWidth,
                      cssWidth: calcCssWidth,
                      jsWidth: calcJsWidth,
                    });
                    setIsResizing("css");
                  }
                }}
                style={{ minWidth: "4px" }}
              />
            </>
          )}

          {/* JS Editor */}
          {!jsCollapsed && (
            <>
              <div className="min-h-0" style={{ width: `${calcJsWidth}%` }}>
                <CodeEditor
                  language="javascript"
                  value={js}
                  onChange={setJs}
                  readOnly={!canEdit}
                  isCollapsed={jsCollapsed}
                  onToggleCollapse={() => setJsCollapsed(true)}
                />
              </div>
              <div
                className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (containerRef.current) {
                    setResizeStart({
                      x: e.clientX,
                      htmlWidth: calcHtmlWidth,
                      cssWidth: calcCssWidth,
                      jsWidth: calcJsWidth,
                    });
                    setIsResizing("js");
                  }
                }}
                style={{ minWidth: "4px" }}
              />
            </>
          )}

          {/* Preview/Console Panel */}
          <div
            className="min-h-0 flex flex-col h-full"
            style={{ width: `${previewWidth}%` }}
          >
            <div className="flex border-b border-gray-300 bg-gray-100 flex-shrink-0">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "preview"
                    ? "bg-white border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab("console")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "console"
                    ? "bg-white border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Console ({consoleLogs.length})
              </button>
            </div>
            <div className="flex-1 min-h-0 relative h-full">
              <div className={`absolute inset-0 ${activeTab === "preview" ? "block" : "hidden"}`}>
                <Preview
                  ref={previewRef}
                  html={html}
                  css={css}
                  js={js}
                  onConsoleLog={handleConsoleLog}
                  shouldRun={shouldRunCode}
                />
              </div>
              <div className={`absolute inset-0 ${activeTab === "console" ? "block" : "hidden"}`}>
                <Console logs={consoleLogs} onRun={handleRunCode} onClear={handleClearConsole} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLoginSuccess}
      />

      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        html={html}
        css={css}
        js={js}
      />
    </div>
  );
}
