export function showToast(message: string, type: "success" | "error") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("__showToast", { detail: { message, type } }),
  );
}
