"use client";

import React, { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";

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
  // Configure language extensions based on the language prop
  const extensions = useMemo(() => {
    switch (language.toLowerCase()) {
      case "html":
        return [html()];
      case "css":
        return [css()];
      case "javascript":
      case "js":
        return [javascript()];
      default:
        return [];
    }
  }, [language]);

  return (
    <div className="flex flex-col h-full border border-gray-300 rounded overflow-hidden">
      <div className="bg-gray-100 px-3 py-2 border-b border-gray-300 text-xs font-bold text-gray-600 flex justify-between items-center flex-shrink-0">
        <span>{language.toUpperCase()}</span>
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
      {!isCollapsed && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <CodeMirror
            value={value}
            height="100%"
            extensions={extensions}
            onChange={onChange}
            editable={!readOnly}
            basicSetup={{
              lineNumbers: true,
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
