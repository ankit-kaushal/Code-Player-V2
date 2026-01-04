"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Resizable } from "re-resizable";
import { useAuth } from "./context/AuthContext";
import CodeEditor from "./components/CodeEditor";
import Preview, { PreviewHandle } from "./components/Preview";
import Console from "./components/Console";
import LoginModal from "./components/LoginModal";
import EmailModal from "./components/EmailModal";
import Header from "./components/Header";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ConsoleLog {
  type: string;
  message: string;
  timestamp: string;
}

export default function Home() {
  const router = useRouter();
  const { user, login, logout } = useAuth();
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [js, setJs] = useState("");
  const [shareId, setShareId] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [activeTab, setActiveTab] = useState<"preview" | "console">("preview");
  const [shouldRunCode, setShouldRunCode] = useState(false);
  const previewRef = useRef<PreviewHandle>(null);

  // Collapsible states
  const [htmlCollapsed, setHtmlCollapsed] = useState(false);
  const [cssCollapsed, setCssCollapsed] = useState(false);
  const [jsCollapsed, setJsCollapsed] = useState(false);

  // Resizable widths (in percentage)
  const [htmlWidth, setHtmlWidth] = useState(25);
  const [cssWidth, setCssWidth] = useState(25);
  const [jsWidth, setJsWidth] = useState(25);
  const containerRef = useRef<HTMLDivElement>(null);

  const checkCanEdit = useCallback(
    async (id: string | null = shareId) => {
      if (!user || !id) return;

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/code/shared/${id}/can-edit`, {
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
    },
    [user, shareId]
  );

  useEffect(() => {
    // Check if viewing a shared code from URL path
    if (typeof window === "undefined") return;

    const pathParts = window.location.pathname.split("/").filter(Boolean);
    if (
      pathParts.length > 0 &&
      pathParts[0] !== "api" &&
      pathParts[0] !== "account"
    ) {
      const sharedId = pathParts[0];
      // Set shareId immediately from URL so Header shows correct button
      setShareId(sharedId);
      loadSharedCode(sharedId);
    } else if (pathParts.length === 0) {
      // On root path, clear shareId
      setShareId(null);
    }
  }, []);

  useEffect(() => {
    // Check edit permissions when user or shareId changes
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

  // Resizing is now handled by re-resizable library

  const loadSharedCode = async (id: string) => {
    try {
      const response = await fetch(`/api/code/shared/${id}`);
      if (!response.ok) {
        throw new Error("Failed to load code");
      }
      const code = await response.json();
      setHtml(code.html || "");
      setCss(code.css || "");
      setJs(code.js || "");
      setShareId(id);

      if (user) {
        checkCanEdit(id);
      } else {
        setCanEdit(false);
      }
    } catch (error) {
      console.error("Error loading shared code:", error);
      alert("Failed to load shared code");
    }
  };

  const handleSave = async () => {
    if (!user || !shareId) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      // Update existing code
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

      setMessage("Code saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      setMessage(error.message || "Failed to save code");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSaving(false);
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

      // Save the code without shareId to create new
      const response = await fetch("/api/code/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ html, css, js }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save");
      }

      const newShareId = data.shareId;
      setShareId(newShareId);

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

  const handleDownloadOneFile = () => {
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

  const handleDownloadMultipleFiles = () => {
    // Build HTML with links to CSS and JS files
    let htmlContent = html || "";
    
    // Check if HTML already has a proper structure
    const hasHtmlTag = /<html[\s>]/i.test(htmlContent);
    const hasHeadTag = /<head[\s>]/i.test(htmlContent);
    const hasBodyTag = /<body[\s>]/i.test(htmlContent);
    
    if (!hasHtmlTag) {
      // Create a complete HTML structure
      let headContent = "";
      let bodyContent = htmlContent;
      
      // Add CSS link if CSS exists
      if (css) {
        headContent += '    <link rel="stylesheet" href="styles.css">\n';
      }
      
      // Add meta tags
      headContent = `    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Code Player Export</title>\n${headContent}`;
      
      // Add JS script before closing body if JS exists
      if (js) {
        bodyContent += '\n    <script src="script.js"></script>';
      }
      
      htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
${headContent}</head>
<body>
${bodyContent}
</body>
</html>`;
    } else {
      // HTML has structure, inject links appropriately
      if (css && !/<link[^>]*styles\.css/i.test(htmlContent)) {
        // Add CSS link in head
        if (hasHeadTag) {
          htmlContent = htmlContent.replace(
            /(<head[^>]*>)/i,
            `$1\n    <link rel="stylesheet" href="styles.css">`
          );
        } else if (hasHtmlTag) {
          // Add head if it doesn't exist
          htmlContent = htmlContent.replace(
            /(<html[^>]*>)/i,
            `$1\n<head>\n    <link rel="stylesheet" href="styles.css">\n</head>`
          );
        }
      }
      
      if (js && !/<script[^>]*script\.js/i.test(htmlContent)) {
        // Add JS script before closing body
        if (hasBodyTag) {
          htmlContent = htmlContent.replace(
            /(<\/body>)/i,
            `    <script src="script.js"></script>\n$1`
          );
        } else {
          // Add body if it doesn't exist
          htmlContent = htmlContent.replace(
            /(<\/html>)/i,
            `<body>\n    <script src="script.js"></script>\n</body>\n$1`
          );
        }
      }
    }
    
    // Download HTML file
    if (htmlContent) {
      const htmlBlob = new Blob([htmlContent], { type: "text/html" });
      const htmlUrl = URL.createObjectURL(htmlBlob);
      const htmlLink = document.createElement("a");
      htmlLink.href = htmlUrl;
      htmlLink.download = "index.html";
      document.body.appendChild(htmlLink);
      htmlLink.click();
      document.body.removeChild(htmlLink);
      URL.revokeObjectURL(htmlUrl);
    }

    // Download CSS file
    if (css) {
      setTimeout(() => {
        const cssBlob = new Blob([css], { type: "text/css" });
        const cssUrl = URL.createObjectURL(cssBlob);
        const cssLink = document.createElement("a");
        cssLink.href = cssUrl;
        cssLink.download = "styles.css";
        document.body.appendChild(cssLink);
        cssLink.click();
        document.body.removeChild(cssLink);
        URL.revokeObjectURL(cssUrl);
      }, 100);
    }

    // Download JavaScript file
    if (js) {
      setTimeout(() => {
        const jsBlob = new Blob([js], { type: "text/javascript" });
        const jsUrl = URL.createObjectURL(jsBlob);
        const jsLink = document.createElement("a");
        jsLink.href = jsUrl;
        jsLink.download = "script.js";
        document.body.appendChild(jsLink);
        jsLink.click();
        document.body.removeChild(jsLink);
        URL.revokeObjectURL(jsUrl);
      }, 200);
    }
  };

  const handleDownloadPreviewAsPDF = async () => {
    const iframe = previewRef.current?.getIframe();
    if (!iframe) {
      alert("Preview not available");
      return;
    }

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc || !iframeDoc.body) {
        alert("Preview content not available");
        return;
      }

      const canvas = await html2canvas(iframeDoc.body, {
        useCORS: true,
        scale: 2,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("preview.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const handleDownloadPreviewAsImage = async () => {
    const iframe = previewRef.current?.getIframe();
    if (!iframe) {
      alert("Preview not available");
      return;
    }

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc || !iframeDoc.body) {
        alert("Preview content not available");
        return;
      }

      const canvas = await html2canvas(iframeDoc.body, {
        useCORS: true,
        scale: 2,
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "preview.png";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Failed to generate image. Please try again.");
    }
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
    // Don't clear logs here - let runCode() handle it to avoid timing issues
    // Always try to use the ref first
    if (previewRef.current) {
      try {
        previewRef.current.runCode();
      } catch (error) {
        console.error("Error running code via ref:", error);
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
    // Also clear logs in Preview component
    if (previewRef.current) {
      previewRef.current.clearLogs();
    }
  };

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

  return (
    <main className="h-screen flex flex-col overflow-hidden bg-gray-100">
      <h1 className="sr-only">
        Code Player - Online HTML, CSS & JavaScript Editor
      </h1>
      <Header
        showEmailButton={true}
        showShareButton={!shareId}
        showSaveButton={!!shareId}
        showDownloadButton={true}
        onEmailClick={handleEmailClick}
        onShareClick={handleShare}
        onSaveClick={handleSave}
        onDownloadOneFile={handleDownloadOneFile}
        onDownloadMultipleFiles={handleDownloadMultipleFiles}
        onDownloadPreviewAsPDF={handleDownloadPreviewAsPDF}
        onDownloadPreviewAsImage={handleDownloadPreviewAsImage}
        shareDisabled={!canEdit}
        shareLoading={saving}
        saveLoading={saving}
        onLoginClick={() => setIsLoginModalOpen(true)}
      />

      {message && (
        <div className="bg-green-500 text-white px-4 py-2 text-center text-sm">
          {message}
        </div>
      )}

      {!canEdit && (
        <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm">
          You are viewing a shared code. Login as owner to edit.
        </div>
      )}

      <div className="flex-1 flex relative min-h-0">
        {/* Collapsed Editors Sidebar */}
        {(htmlCollapsed || cssCollapsed || jsCollapsed) && (
          <div className="hidden md:flex w-16 bg-gray-200 border-r border-gray-300 flex-col items-center py-3 gap-2 flex-shrink-0">
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

        {/* Mobile Layout - Stacked Vertically */}
        <div className="md:hidden flex-1 flex flex-col gap-2 p-2 min-h-0 overflow-hidden">
          {/* Collapsed Editors Buttons - Mobile */}
          {(htmlCollapsed || cssCollapsed || jsCollapsed) && (
            <div className="flex gap-2 flex-wrap mb-2">
              {htmlCollapsed && (
                <button
                  onClick={() => setHtmlCollapsed(false)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 shadow"
                >
                  Reopen HTML
                </button>
              )}
              {cssCollapsed && (
                <button
                  onClick={() => setCssCollapsed(false)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 shadow"
                >
                  Reopen CSS
                </button>
              )}
              {jsCollapsed && (
                <button
                  onClick={() => setJsCollapsed(false)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 shadow"
                >
                  Reopen JS
                </button>
              )}
            </div>
          )}

          {/* HTML Editor - Mobile */}
          {!htmlCollapsed && (
            <div className="w-full flex-shrink-0" style={{ height: "200px" }}>
              <CodeEditor
                language="html"
                value={html}
                onChange={setHtml}
                readOnly={!canEdit}
                isCollapsed={htmlCollapsed}
                onToggleCollapse={() => setHtmlCollapsed(true)}
              />
            </div>
          )}

          {/* CSS Editor - Mobile */}
          {!cssCollapsed && (
            <div className="w-full flex-shrink-0" style={{ height: "200px" }}>
              <CodeEditor
                language="css"
                value={css}
                onChange={setCss}
                readOnly={!canEdit}
                isCollapsed={cssCollapsed}
                onToggleCollapse={() => setCssCollapsed(true)}
              />
            </div>
          )}

          {/* JS Editor - Mobile */}
          {!jsCollapsed && (
            <div className="w-full flex-shrink-0" style={{ height: "200px" }}>
              <CodeEditor
                language="javascript"
                value={js}
                onChange={setJs}
                readOnly={!canEdit}
                isCollapsed={jsCollapsed}
                onToggleCollapse={() => setJsCollapsed(true)}
              />
            </div>
          )}

          {/* Preview/Console Panel - Mobile */}
          <div
            className="w-full border border-gray-300 rounded flex flex-col flex-1 min-h-0"
            style={{ height: 0 }}
          >
            <div className="flex border-gray-300 bg-gray-100 flex-shrink-0">
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
            <div
              className="flex-1 min-h-0 relative overflow-hidden"
              style={{ height: "100%" }}
            >
              <div
                className={`absolute inset-0 w-full h-full ${
                  activeTab === "preview" ? "flex" : "hidden"
                }`}
                style={{ flexDirection: "column" }}
              >
                <Preview
                  ref={previewRef}
                  html={html}
                  css={css}
                  js={js}
                  onConsoleLog={handleConsoleLog}
                  shouldRun={shouldRunCode}
                />
              </div>
              <div
                className={`absolute inset-0 w-full h-full ${
                  activeTab === "console" ? "flex" : "hidden"
                }`}
                style={{ flexDirection: "column" }}
              >
                <Console
                  logs={consoleLogs}
                  onRun={handleRunCode}
                  onClear={handleClearConsole}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Horizontal with Resizable */}
        <div
          ref={containerRef}
          className="hidden md:flex flex-1 flex-row gap-2 p-2 min-h-0"
          style={{ position: "relative", minWidth: 0, overflow: "hidden" }}
        >
          {/* HTML Editor - Desktop */}
          {!htmlCollapsed && (
            <Resizable
              size={{ width: `${calcHtmlWidth}%`, height: "100%" }}
              minWidth="10%"
              maxWidth="60%"
              enable={{ right: true, left: false, top: false, bottom: false }}
              handleStyles={{ right: { cursor: "col-resize" } }}
              handleClasses={{ right: "resize-handle" }}
              onResizeStop={(e, direction, ref, d) => {
                if (containerRef.current) {
                  const containerWidth = containerRef.current.offsetWidth;
                  const newWidthPercentage =
                    (((calcHtmlWidth * containerWidth) / 100 + d.width) /
                      containerWidth) *
                    100;
                  const newHtmlWidth = Math.max(
                    10,
                    Math.min(60, newWidthPercentage)
                  );
                  setHtmlWidth(newHtmlWidth);

                  // Adjust next visible editor
                  if (!cssCollapsed) {
                    const delta = newHtmlWidth - calcHtmlWidth;
                    setCssWidth(Math.max(10, calcCssWidth - delta));
                  } else if (!jsCollapsed) {
                    const delta = newHtmlWidth - calcHtmlWidth;
                    setJsWidth(Math.max(10, calcJsWidth - delta));
                  }
                }
              }}
              className="min-h-0"
              style={{ minWidth: 0, maxWidth: "100%", overflow: "hidden" }}
            >
              <div
                className="h-full"
                style={{ minWidth: 0, maxWidth: "100%", overflow: "hidden" }}
              >
                <CodeEditor
                  language="html"
                  value={html}
                  onChange={setHtml}
                  readOnly={!canEdit}
                  isCollapsed={htmlCollapsed}
                  onToggleCollapse={() => setHtmlCollapsed(true)}
                />
              </div>
            </Resizable>
          )}

          {/* CSS Editor - Desktop */}
          {!cssCollapsed && (
            <Resizable
              size={{ width: `${calcCssWidth}%`, height: "100%" }}
              minWidth="10%"
              maxWidth="60%"
              enable={{ right: true, left: false, top: false, bottom: false }}
              handleStyles={{ right: { cursor: "col-resize" } }}
              handleClasses={{ right: "resize-handle" }}
              onResizeStop={(e, direction, ref, d) => {
                if (containerRef.current) {
                  const containerWidth = containerRef.current.offsetWidth;
                  const newWidthPercentage =
                    (((calcCssWidth * containerWidth) / 100 + d.width) /
                      containerWidth) *
                    100;
                  const newCssWidth = Math.max(
                    10,
                    Math.min(60, newWidthPercentage)
                  );
                  setCssWidth(newCssWidth);

                  // Adjust next visible editor
                  if (!jsCollapsed) {
                    const delta = newCssWidth - calcCssWidth;
                    setJsWidth(Math.max(10, calcJsWidth - delta));
                  }
                }
              }}
              className="min-h-0"
              style={{ minWidth: 0, maxWidth: "100%", overflow: "hidden" }}
            >
              <div
                className="h-full"
                style={{ minWidth: 0, maxWidth: "100%", overflow: "hidden" }}
              >
                <CodeEditor
                  language="css"
                  value={css}
                  onChange={setCss}
                  readOnly={!canEdit}
                  isCollapsed={cssCollapsed}
                  onToggleCollapse={() => setCssCollapsed(true)}
                />
              </div>
            </Resizable>
          )}

          {/* JS Editor - Desktop */}
          {!jsCollapsed && (
            <Resizable
              size={{ width: `${calcJsWidth}%`, height: "100%" }}
              minWidth="10%"
              maxWidth={`${100 - (calcHtmlWidth + calcCssWidth) - 10}%`}
              enable={{ right: true, left: false, top: false, bottom: false }}
              handleStyles={{
                right: { cursor: "col-resize", width: "4px", right: "-2px" },
              }}
              handleClasses={{ right: "resize-handle" }}
              onResizeStop={(e, direction, ref, d) => {
                if (containerRef.current) {
                  const containerWidth = containerRef.current.offsetWidth;
                  const newWidthPercentage =
                    (((calcJsWidth * containerWidth) / 100 + d.width) /
                      containerWidth) *
                    100;
                  setJsWidth(
                    Math.max(
                      10,
                      Math.min(
                        100 - (calcHtmlWidth + calcCssWidth) - 10,
                        newWidthPercentage
                      )
                    )
                  );
                }
              }}
              className="min-h-0"
              style={{ minWidth: 0, maxWidth: "100%", overflow: "hidden" }}
            >
              <div
                className="h-full"
                style={{ minWidth: 0, maxWidth: "100%", overflow: "hidden" }}
              >
                <CodeEditor
                  language="javascript"
                  value={js}
                  onChange={setJs}
                  readOnly={!canEdit}
                  isCollapsed={jsCollapsed}
                  onToggleCollapse={() => setJsCollapsed(true)}
                />
              </div>
            </Resizable>
          )}

          {/* Preview/Console Panel - Desktop */}
          <div
            className="hidden md:flex min-h-0 flex-col h-full"
            style={{ width: `${previewWidth}%` }}
          >
            <div className="flex border-gray-300 bg-gray-100 flex-shrink-0">
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
              <div
                className={`absolute inset-0 ${
                  activeTab === "preview" ? "block" : "hidden"
                }`}
              >
                <Preview
                  ref={previewRef}
                  html={html}
                  css={css}
                  js={js}
                  onConsoleLog={handleConsoleLog}
                  shouldRun={shouldRunCode}
                />
              </div>
              <div
                className={`absolute inset-0 ${
                  activeTab === "console" ? "block" : "hidden"
                }`}
              >
                <Console
                  logs={consoleLogs}
                  onRun={handleRunCode}
                  onClear={handleClearConsole}
                />
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
    </main>
  );
}
