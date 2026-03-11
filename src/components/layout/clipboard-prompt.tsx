"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { isYupooUrl, isWeidianUrl } from "@/lib/utils";

function isProductUrl(text: string): boolean {
  return isYupooUrl(text) || isWeidianUrl(text);
}

export function ClipboardPrompt() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  const checkClipboard = useCallback(async () => {
    // Don't check if already on the add product page
    if (pathname === "/products/new") return;
    if (!user) return;

    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      if (isProductUrl(trimmed) && trimmed !== dismissed) {
        setClipboardUrl(trimmed);
      }
    } catch {
      // Clipboard permission denied — silently ignore
    }
  }, [pathname, user, dismissed]);

  useEffect(() => {
    // Check on mount
    checkClipboard();

    // Check when window regains focus
    const onFocus = () => checkClipboard();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") checkClipboard();
    });

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [checkClipboard]);

  const handleAdd = () => {
    if (!clipboardUrl) return;
    const encoded = encodeURIComponent(clipboardUrl);
    setClipboardUrl(null);
    router.push(`/products/new?url=${encoded}`);
  };

  const handleDismiss = () => {
    setDismissed(clipboardUrl);
    setClipboardUrl(null);
  };

  return (
    <AnimatePresence>
      {clipboardUrl && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl shadow-black/20">
            <Sparkles size={18} className="text-[var(--accent)] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Product link detected</p>
              <p className="text-xs text-[var(--text-muted)] truncate">
                {clipboardUrl}
              </p>
            </div>
            <Button size="sm" onClick={handleAdd}>
              Add
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
