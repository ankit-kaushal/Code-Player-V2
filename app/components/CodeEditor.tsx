"use client";

import React, { useMemo, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";
import { indentUnit } from "@codemirror/language";

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  language,
  value,
  onChange,
  readOnly = false,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const editorViewRef = useRef<EditorView | null>(null);
  const tabSize = 2; // Fixed tab size

  // Configure language extensions based on the language prop
  const extensions = useMemo(() => {
    const baseExtensions = [
      EditorView.updateListener.of((update) => {
        if (update.view) {
          editorViewRef.current = update.view;
        }
      }),
      indentUnit.of(" ".repeat(tabSize)),
    ];

    switch (language.toLowerCase()) {
      case "html":
        return [...baseExtensions, html()];
      case "css":
        return [...baseExtensions, css()];
      case "javascript":
      case "js":
        return [...baseExtensions, javascript()];
      default:
        return baseExtensions;
    }
  }, [language]);

  const handleFormat = () => {
    if (readOnly || !editorViewRef.current) return;

    let formatted = value;
    try {
      switch (language.toLowerCase()) {
        case "html":
          // Basic HTML formatting - indent nested elements
          formatted = formatHTML(value, tabSize);
          break;
        case "css":
          // Basic CSS formatting
          formatted = formatCSS(value, tabSize);
          break;
        case "javascript":
        case "js":
          // Basic JS formatting
          formatted = formatJS(value, tabSize);
          break;
      }
      onChange(formatted);
    } catch (error) {
      console.error("Formatting error:", error);
    }
  };

  const formatHTML = (code: string, indent: number): string => {
    let formatted = "";
    let indentLevel = 0;
    const indentStr = " ".repeat(indent);
    const lines = code.split("\n");

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        formatted += "\n";
        continue;
      }

      // Decrease indent for closing tags
      if (trimmed.startsWith("</")) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      formatted += indentStr.repeat(indentLevel) + trimmed + "\n";

      // Increase indent for opening tags (but not self-closing)
      if (
        trimmed.startsWith("<") &&
        !trimmed.startsWith("</") &&
        !trimmed.endsWith("/>") &&
        !trimmed.match(/<[^>]+>$/)
      ) {
        indentLevel++;
      }
    }

    return formatted.trim() + "\n";
  };

  const formatCSS = (code: string, indent: number): string => {
    let formatted = "";
    let indentLevel = 0;
    const indentStr = " ".repeat(indent);
    const lines = code.split("\n");

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        formatted += "\n";
        continue;
      }

      if (trimmed.endsWith("{")) {
        formatted += indentStr.repeat(indentLevel) + trimmed + "\n";
        indentLevel++;
      } else if (trimmed.startsWith("}")) {
        indentLevel = Math.max(0, indentLevel - 1);
        formatted += indentStr.repeat(indentLevel) + trimmed + "\n";
      } else {
        formatted += indentStr.repeat(indentLevel) + trimmed + "\n";
      }
    }

    return formatted.trim() + "\n";
  };

  const formatJS = (code: string, indent: number): string => {
    let formatted = "";
    let indentLevel = 0;
    const indentStr = " ".repeat(indent);
    const lines = code.split("\n");

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        formatted += "\n";
        continue;
      }

      // Decrease indent for closing braces/brackets
      if (trimmed.startsWith("}") || trimmed.startsWith("]")) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      formatted += indentStr.repeat(indentLevel) + trimmed + "\n";

      // Increase indent for opening braces/brackets
      if (trimmed.endsWith("{") || trimmed.endsWith("[")) {
        indentLevel++;
      }
    }

    return formatted.trim() + "\n";
  };

  return (
    <div
      className="flex flex-col h-full w-full border border-gray-300 rounded overflow-hidden"
      style={{ minWidth: 0, maxWidth: "100%" }}
    >
      <div className="bg-gray-100 border-b border-gray-300 flex-shrink-0">
        <div className="px-3 py-2 text-xs font-bold text-gray-600 flex justify-between items-center">
          <span>{language.toUpperCase()}</span>
          <div className="flex items-center gap-2">
            {!isCollapsed && !readOnly && (
              <button
                onClick={handleFormat}
                className="px-1.5 py-0.5 bg-white text-gray-600 border border-gray-300 rounded hover:bg-gray-50 hover:border-gray-400 transition-all text-[10px] font-medium shadow-sm"
                title="Format Code"
                type="button"
              >
                ✨ Format
              </button>
            )}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="text-gray-500 hover:text-gray-700 text-lg leading-none"
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? "▶" : "▼"}
              </button>
            )}
          </div>
        </div>
      </div>
      {!isCollapsed && (
        <div
          className="flex-1 min-h-0 overflow-y-auto bg-white"
          style={{ minWidth: 0, maxWidth: "100%", overflowX: "auto" }}
        >
          <CodeMirror
            value={value}
            height="100%"
            extensions={extensions}
            onChange={onChange}
            editable={!readOnly}
            basicSetup={{
              lineNumbers: false,
              foldGutter: true,
              dropCursor: false,
              allowMultipleSelections: false,
              indentOnInput: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              highlightSelectionMatches: true,
            }}
            placeholder={`Enter your ${language} code here...`}
          />
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
