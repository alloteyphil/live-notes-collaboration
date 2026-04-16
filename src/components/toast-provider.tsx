"use client";

import { useMemo } from "react";
import { Toaster, toast } from "sonner";

type ToastVariant = "success" | "error" | "info";

type ToastInput = {
  message: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  showToast: (input: ToastInput) => void;
};

const TOAST_DURATION_MS = 3_000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors closeButton position="top-right" />
    </>
  );
}

export function useToast() {
  return useMemo<ToastContextValue>(() => ({ showToast }), []);
}

const showToast: ToastContextValue["showToast"] = (input) => {
  const variant = input.variant ?? "info";
  const options = { duration: TOAST_DURATION_MS };
  if (variant === "success") {
    toast.success(input.message, options);
    return;
  }
  if (variant === "error") {
    toast.error(input.message, options);
    return;
  }
  toast.info(input.message, options);
};
