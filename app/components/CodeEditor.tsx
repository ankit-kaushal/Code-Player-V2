"use client";

import React from "react";

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
  return (
    <div className="flex flex-col h-full border border-gray-300 rounded overflow-hidden">
      <div className="bg-gray-100 px-3 py-2 border-b border-gray-300 text-xs font-bold text-gray-600 flex justify-between items-center">
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
        <textarea
          className="flex-1 w-full p-4 border-none outline-none font-mono text-sm resize-none bg-white text-gray-800"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          placeholder={`Enter your ${language} code here...`}
          spellCheck={false}
          style={{
            backgroundColor: readOnly ? "#f9f9f9" : "#fff",
            cursor: readOnly ? "not-allowed" : "text",
          }}
        />
      )}
    </div>
  );
};

export default CodeEditor;
