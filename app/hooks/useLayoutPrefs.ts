"use client";

import { useEffect, useRef, useState } from "react";
import {
  LayoutMode,
  loadLayoutPrefs,
  saveLayoutPrefs,
} from "@/lib/layout-prefs";

export function useLayoutPrefs() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("preview");
  const [htmlWidth, setHtmlWidth] = useState(20);
  const [cssWidth, setCssWidth] = useState(20);
  const [jsWidth, setJsWidth] = useState(20);
  const [splitPreviewPercent, setSplitPreviewPercent] = useState(55);
  const [htmlCollapsed, setHtmlCollapsed] = useState(false);
  const [cssCollapsed, setCssCollapsed] = useState(false);
  const [jsCollapsed, setJsCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const skipEqualResetRef = useRef(true);

  useEffect(() => {
    const prefs = loadLayoutPrefs();
    setLayoutMode(prefs.layoutMode);
    setHtmlWidth(prefs.htmlWidth);
    setCssWidth(prefs.cssWidth);
    setJsWidth(prefs.jsWidth);
    setSplitPreviewPercent(prefs.splitPreviewPercent);
    setHtmlCollapsed(prefs.htmlCollapsed);
    setCssCollapsed(prefs.cssCollapsed);
    setJsCollapsed(prefs.jsCollapsed);
    setHydrated(true);
    // Allow one paint after hydrate before equal-width reset on collapse
    requestAnimationFrame(() => {
      skipEqualResetRef.current = false;
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveLayoutPrefs({
      layoutMode,
      htmlWidth,
      cssWidth,
      jsWidth,
      splitPreviewPercent,
      htmlCollapsed,
      cssCollapsed,
      jsCollapsed,
    });
  }, [
    hydrated,
    layoutMode,
    htmlWidth,
    cssWidth,
    jsWidth,
    splitPreviewPercent,
    htmlCollapsed,
    cssCollapsed,
    jsCollapsed,
  ]);

  return {
    layoutMode,
    setLayoutMode,
    htmlWidth,
    setHtmlWidth,
    cssWidth,
    setCssWidth,
    jsWidth,
    setJsWidth,
    splitPreviewPercent,
    setSplitPreviewPercent,
    htmlCollapsed,
    setHtmlCollapsed,
    cssCollapsed,
    setCssCollapsed,
    jsCollapsed,
    setJsCollapsed,
    hydrated,
    skipEqualResetRef,
  };
}
