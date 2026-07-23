"use client";

import { useState, useEffect, useCallback } from "react";

interface ToastState {
  message: string;
  type: "success" | "error";
}

export default function Toaster() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const clear = useCallback(() => setToast(null), []);

  useEffect(() => {
    function handler(e: CustomEvent<ToastState>) {
      setToast(e.detail);
    }
    window.addEventListener("__showToast", handler as EventListener);
    return () =>
      window.removeEventListener("__showToast", handler as EventListener);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(clear, 3000);
    return () => clearTimeout(timer);
  }, [toast, clear]);

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center pt-4">
      <div
        className={`pointer-events-auto flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-semibold shadow-lg transition-all ${
          toast.type === "success"
            ? "bg-green-600 text-white"
            : "bg-red-600 text-white"
        }`}
      >
        <span>{toast.message}</span>
        <button
          onClick={() => setToast(null)}
          className="ml-1 rounded-lg p-0.5 opacity-80 hover:opacity-100"
          aria-label="Cerrar"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
