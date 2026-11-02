export type LayoutMode = "preview" | "console" | "split";

export const LAYOUT_STORAGE_KEYS = {
  layoutMode: "cp_layoutMode",
  htmlWidth: "cp_htmlWidth",
  cssWidth: "cp_cssWidth",
  jsWidth: "cp_jsWidth",
  splitPreviewPercent: "cp_splitPreviewPercent",
  htmlCollapsed: "cp_htmlCollapsed",
  cssCollapsed: "cp_cssCollapsed",
  jsCollapsed: "cp_jsCollapsed",
  autoRun: "cp_autoRun",
} as const;

const DEFAULTS = {
  layoutMode: "preview" as LayoutMode,
  htmlWidth: 20,
  cssWidth: 20,
  jsWidth: 20,
  splitPreviewPercent: 55,
  htmlCollapsed: false,
  cssCollapsed: false,
  jsCollapsed: false,
  autoRun: false, // console auto-capture; preview always runs
};

const MAX_EDITOR_TOTAL = 65; // leave at least ~35% for preview/console

function readNumber(key: string, fallback: number, min: number, max: number) {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (raw == null) return fallback;
  const value = Number(raw);
  if (Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function readBoolean(key: string, fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (raw == null) return fallback;
  return raw === "true";
}

function readLayoutMode(key: string): LayoutMode {
  if (typeof window === "undefined") return DEFAULTS.layoutMode;
  const raw = localStorage.getItem(key);
  if (raw === "preview" || raw === "console" || raw === "split") return raw;
  // Migrate old exclusive tab values if any
  if (raw === "both") return "split";
  return DEFAULTS.layoutMode;
}

function balanceEditorWidths(htmlWidth: number, cssWidth: number, jsWidth: number) {
  const total = htmlWidth + cssWidth + jsWidth;
  if (total <= MAX_EDITOR_TOTAL || total <= 0) {
    return { htmlWidth, cssWidth, jsWidth };
  }
  const scale = MAX_EDITOR_TOTAL / total;
  return {
    htmlWidth: Math.max(10, Math.round(htmlWidth * scale * 10) / 10),
    cssWidth: Math.max(10, Math.round(cssWidth * scale * 10) / 10),
    jsWidth: Math.max(10, Math.round(jsWidth * scale * 10) / 10),
  };
}

export function loadLayoutPrefs() {
  const widths = balanceEditorWidths(
    readNumber(LAYOUT_STORAGE_KEYS.htmlWidth, DEFAULTS.htmlWidth, 10, 60),
    readNumber(LAYOUT_STORAGE_KEYS.cssWidth, DEFAULTS.cssWidth, 10, 60),
    readNumber(LAYOUT_STORAGE_KEYS.jsWidth, DEFAULTS.jsWidth, 10, 70)
  );

  return {
    layoutMode: readLayoutMode(LAYOUT_STORAGE_KEYS.layoutMode),
    ...widths,
    splitPreviewPercent: readNumber(
      LAYOUT_STORAGE_KEYS.splitPreviewPercent,
      DEFAULTS.splitPreviewPercent,
      20,
      80
    ),
    htmlCollapsed: readBoolean(
      LAYOUT_STORAGE_KEYS.htmlCollapsed,
      DEFAULTS.htmlCollapsed
    ),
    cssCollapsed: readBoolean(
      LAYOUT_STORAGE_KEYS.cssCollapsed,
      DEFAULTS.cssCollapsed
    ),
    jsCollapsed: readBoolean(
      LAYOUT_STORAGE_KEYS.jsCollapsed,
      DEFAULTS.jsCollapsed
    ),
    autoRun: readBoolean(LAYOUT_STORAGE_KEYS.autoRun, DEFAULTS.autoRun),
  };
}

export function saveLayoutPrefs(prefs: {
  layoutMode: LayoutMode;
  htmlWidth: number;
  cssWidth: number;
  jsWidth: number;
  splitPreviewPercent: number;
  htmlCollapsed: boolean;
  cssCollapsed: boolean;
  jsCollapsed: boolean;
  autoRun: boolean;
}) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAYOUT_STORAGE_KEYS.layoutMode, prefs.layoutMode);
  localStorage.setItem(LAYOUT_STORAGE_KEYS.htmlWidth, String(prefs.htmlWidth));
  localStorage.setItem(LAYOUT_STORAGE_KEYS.cssWidth, String(prefs.cssWidth));
  localStorage.setItem(LAYOUT_STORAGE_KEYS.jsWidth, String(prefs.jsWidth));
  localStorage.setItem(
    LAYOUT_STORAGE_KEYS.splitPreviewPercent,
    String(prefs.splitPreviewPercent)
  );
  localStorage.setItem(
    LAYOUT_STORAGE_KEYS.htmlCollapsed,
    String(prefs.htmlCollapsed)
  );
  localStorage.setItem(
    LAYOUT_STORAGE_KEYS.cssCollapsed,
    String(prefs.cssCollapsed)
  );
  localStorage.setItem(
    LAYOUT_STORAGE_KEYS.jsCollapsed,
    String(prefs.jsCollapsed)
  );
  localStorage.setItem(LAYOUT_STORAGE_KEYS.autoRun, String(prefs.autoRun));
}
