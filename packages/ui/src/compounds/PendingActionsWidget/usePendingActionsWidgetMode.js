"use client";

import { useEffect, useMemo, useState } from "react";

export const PENDING_ACTIONS_OPEN_VIEW_MODES = ["floating", "rail", "full"];
export const PENDING_ACTIONS_NARROW_VIEWPORT_MAX_WIDTH = 767;
export const PENDING_ACTIONS_RAIL_VIEWPORT_MIN_WIDTH = 1200;
export const PENDING_ACTIONS_VIEWPORT_FALLBACK = 1280;
export const DEFAULT_PENDING_ACTIONS_WIDGET_STORAGE_KEY = "live-activity-widget-view-mode";

export function normalizePendingActionsWidgetViewMode(viewMode) {
  if (PENDING_ACTIONS_OPEN_VIEW_MODES.includes(viewMode)) {
    return viewMode;
  }

  return "closed";
}

export function resolvePendingActionsWidgetResetViewMode(preferredViewMode, defaultViewMode) {
  return normalizePendingActionsWidgetViewMode(preferredViewMode || defaultViewMode);
}

export function getPendingActionsWidgetViewportWidthSnapshot() {
  return globalThis.window?.innerWidth || PENDING_ACTIONS_VIEWPORT_FALLBACK;
}

export function readPendingActionsWidgetStoredViewMode(storageKey) {
  try {
    const storedViewMode = globalThis.window?.localStorage?.getItem(storageKey);
    return storedViewMode ? normalizePendingActionsWidgetViewMode(storedViewMode) : null;
  } catch {
    return null;
  }
}

export function writePendingActionsWidgetStoredViewMode(storageKey, viewMode) {
  try {
    globalThis.window?.localStorage?.setItem(
      storageKey,
      normalizePendingActionsWidgetViewMode(viewMode)
    );
  } catch {
    // noop: storage can fail in restricted environments
  }
}

export function getPendingActionsWidgetAvailableViewModes(viewportWidth) {
  if (viewportWidth < PENDING_ACTIONS_RAIL_VIEWPORT_MIN_WIDTH) {
    return ["floating", "full"];
  }

  return PENDING_ACTIONS_OPEN_VIEW_MODES;
}

export function resolvePendingActionsWidgetResponsiveViewMode(viewMode, viewportWidth) {
  if (viewMode === "rail" && viewportWidth < PENDING_ACTIONS_RAIL_VIEWPORT_MIN_WIDTH) {
    return "full";
  }

  return normalizePendingActionsWidgetViewMode(viewMode);
}

export function usePendingActionsWidgetMode({
  defaultViewMode = "closed",
  preferredViewMode,
  storageKey = DEFAULT_PENDING_ACTIONS_WIDGET_STORAGE_KEY
} = {}) {
  const [viewMode, setViewMode] = useState(() => {
    const storedViewMode = readPendingActionsWidgetStoredViewMode(storageKey);

    if (storedViewMode) {
      return storedViewMode;
    }

    return resolvePendingActionsWidgetResetViewMode(preferredViewMode, defaultViewMode);
  });
  const [viewportWidth, setViewportWidth] = useState(getPendingActionsWidgetViewportWidthSnapshot);

  useEffect(() => {
    const storedViewMode = readPendingActionsWidgetStoredViewMode(storageKey);

    if (storedViewMode) {
      setViewMode(storedViewMode);
      return;
    }

    setViewMode(resolvePendingActionsWidgetResetViewMode(preferredViewMode, defaultViewMode));
  }, [defaultViewMode, preferredViewMode, storageKey]);

  useEffect(() => {
    function handleResize() {
      setViewportWidth(getPendingActionsWidgetViewportWidthSnapshot());
    }

    handleResize();
    globalThis.window?.addEventListener("resize", handleResize);

    return () => {
      globalThis.window?.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    writePendingActionsWidgetStoredViewMode(storageKey, viewMode);
  }, [storageKey, viewMode]);

  const responsiveViewMode = useMemo(
    () => resolvePendingActionsWidgetResponsiveViewMode(viewMode, viewportWidth),
    [viewMode, viewportWidth]
  );
  const availableViewModes = useMemo(
    () => getPendingActionsWidgetAvailableViewModes(viewportWidth),
    [viewportWidth]
  );
  const isNarrowViewport = viewportWidth <= PENDING_ACTIONS_NARROW_VIEWPORT_MAX_WIDTH;

  return {
    availableViewModes,
    isNarrowViewport,
    responsiveViewMode,
    setViewMode,
    viewMode,
    viewportWidth
  };
}
