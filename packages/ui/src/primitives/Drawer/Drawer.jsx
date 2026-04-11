"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { cx } from "../_utils/cx.js";

export function Drawer({
  isOpen = false,
  onClose,
  position = "left",
  className = "",
  panelClassName = "",
  panelId,
  ariaLabel = "Navigation drawer",
  children
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return undefined;
    }

    const { body } = document;
    const previousOverflow = body.style.overflow;

    body.style.overflow = "hidden";

    function handleEscapeKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleEscapeKeyDown);

    return () => {
      body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscapeKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isMounted || !isOpen) {
    return null;
  }

  return createPortal(
    <div
      className={cx("c-Drawer", "c-Drawer--open", `c-Drawer--${position}`, className)}
      onClick={() => onClose?.()}
    >
      <div className="c-Drawer__backdrop" aria-hidden="true" />
      <div
        className={cx("c-Drawer__panel", panelClassName)}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
