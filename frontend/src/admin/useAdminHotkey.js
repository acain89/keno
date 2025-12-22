// src/admin/useAdminHotkey.js
import { useEffect, useRef } from "react";

/**
 * Reliable Admin Hotkey: Ctrl + Shift + K
 *
 * Fixes:
 * - Ignores key repeat
 * - Works across layouts (key vs code)
 * - Does NOT fire while typing in inputs/textareas
 * - Prevents multiple triggers per press
 */

export default function useAdminHotkey(onTrigger) {
  const armedRef = useRef(true);

  useEffect(() => {
    const isTypingTarget = (el) => {
      if (!el) return false;
      const tag = el.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        el.isContentEditable
      );
    };

    const down = (e) => {
      if (e.repeat) return;
      if (!armedRef.current) return;
      if (isTypingTarget(e.target)) return;

      const isK =
        e.key?.toLowerCase() === "k" || e.code === "KeyK";

      if (e.ctrlKey && e.shiftKey && isK) {
        e.preventDefault();
        armedRef.current = false;
        onTrigger?.();
      }
    };

    const up = (e) => {
      const isK =
        e.key?.toLowerCase() === "k" || e.code === "KeyK";
      if (isK) armedRef.current = true;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [onTrigger]);
}
