"use client";

import { toast as toastManager } from "@/components/ui/toast";

// Compatibility wrapper: provides the old `useToast()` hook API
// backed by the new @base-ui toast manager.

type ToastVariant = "default" | "destructive";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

function useToast() {
  const toast = (opts: ToastOptions) => {
    const type =
      opts.variant === "destructive" ? "error" : "success";

    toastManager.add({
      title: opts.title ?? "",
      description: opts.description ?? "",
      type,
    });
  };

  return { toast };
}

export { useToast };
