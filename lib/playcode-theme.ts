import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { Extension } from "@codemirror/state";

/** Playcode-inspired dark editor theme */
const playcodeEditorTheme = EditorView.theme(
  {
    "&": {
      color: "#d4d4d4",
      backgroundColor: "#181818",
      height: "100%",
      fontSize: "14px",
    },
    ".cm-content": {
      caretColor: "#ffffff",
      fontSize: "14px",
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "#ffffff",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      {
        backgroundColor: "#264f78",
      },
    ".cm-panels": {
      backgroundColor: "#1f1f1f",
      color: "#d4d4d4",
    },
    ".cm-panels.cm-panels-top": {
      borderBottom: "1px solid #2b2b2b",
    },
    ".cm-panels.cm-panels-bottom": {
      borderTop: "1px solid #2b2b2b",
    },
    ".cm-searchMatch": {
      backgroundColor: "#613214",
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
      backgroundColor: "#9e6a2f",
    },
    ".cm-activeLine": {
      backgroundColor: "#1f1f1f",
    },
    ".cm-selectionMatch": {
      backgroundColor: "#3a3a3a",
    },
    ".cm-matchingBracket, .cm-nonmatchingBracket": {
      backgroundColor: "#3a3a3a",
      outline: "1px solid #555555",
    },
    ".cm-gutters": {
      backgroundColor: "#181818",
      color: "#555555",
      border: "none",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#1f1f1f",
      color: "#8a8a8a",
    },
    ".cm-foldPlaceholder": {
      backgroundColor: "#2b2b2b",
      border: "none",
      color: "#8a8a8a",
    },
    ".cm-tooltip": {
      border: "1px solid #2b2b2b",
      backgroundColor: "#1f1f1f",
      color: "#d4d4d4",
    },
    ".cm-tooltip .cm-tooltip-arrow:before": {
      borderTopColor: "transparent",
      borderBottomColor: "transparent",
    },
    ".cm-tooltip .cm-tooltip-arrow:after": {
      borderTopColor: "#1f1f1f",
      borderBottomColor: "#1f1f1f",
    },
    ".cm-tooltip-autocomplete": {
      "& > ul > li[aria-selected]": {
        backgroundColor: "#2b2b2b",
        color: "#ffffff",
      },
    },
    ".cm-placeholder": {
      color: "#6a6a6a",
    },
    ".cm-scroller": {
      overflow: "auto",
      fontSize: "14px",
      lineHeight: "1.4",
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
    },
  },
  { dark: true }
);

const playcodeHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "#e69d6d" },
  { tag: t.operator, color: "#d4d4d4" },
  { tag: t.special(t.variableName), color: "#9cdcfe" },
  { tag: t.typeName, color: "#4ec9b0" },
  { tag: t.atom, color: "#e69d6d" },
  { tag: t.number, color: "#b5cea8" },
  { tag: t.bool, color: "#e69d6d" },
  { tag: t.string, color: "#ce9178" },
  { tag: t.comment, color: "#6a6a6a" },
  { tag: t.meta, color: "#8a8a8a" },
  { tag: t.definition(t.variableName), color: "#9cdcfe" },
  { tag: t.variableName, color: "#d4d4d4" },
  { tag: t.propertyName, color: "#9cdcfe" },
  { tag: t.function(t.variableName), color: "#dcdcaa" },
  { tag: t.className, color: "#4ec9b0" },
  { tag: t.tagName, color: "#569cd6" },
  { tag: t.attributeName, color: "#9cdcfe" },
  { tag: t.attributeValue, color: "#ce9178" },
  { tag: t.heading, color: "#ffffff", fontWeight: "bold" },
  { tag: t.link, color: "#569cd6", textDecoration: "underline" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.invalid, color: "#f44747" },
  { tag: t.bracket, color: "#d4d4d4" },
  { tag: t.punctuation, color: "#d4d4d4" },
  { tag: t.modifier, color: "#e69d6d" },
  { tag: t.regexp, color: "#d16969" },
  { tag: t.escape, color: "#d7ba7d" },
  { tag: t.color, color: "#ce9178" },
  { tag: t.url, color: "#ce9178" },
]);

export const playcodeDark: Extension = [
  playcodeEditorTheme,
  syntaxHighlighting(playcodeHighlightStyle),
];
