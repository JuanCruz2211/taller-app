import { describe, it, expect } from "vitest";
import { normalizePhone, validatePatente } from "@/lib/phone";

describe("normalizePhone", () => {
  it("converts 10-digit number to +549 format", () => {
    expect(normalizePhone("1144556677")).toBe("+5491144556677");
  });

  it("handles already prefixed number", () => {
    expect(normalizePhone("5491144556677")).toBe("+5491144556677");
  });

  it("handles +54 prefix", () => {
    expect(normalizePhone("541144556677")).toBe("+5491144556677");
  });

  it("throws on invalid input", () => {
    expect(() => normalizePhone("123")).toThrow("Teléfono inválido");
  });
});

describe("validatePatente", () => {
  it("accepts old format ABC-123", () => {
    expect(validatePatente("ABC-123")).toBe(true);
  });

  it("accepts new format AB-123-CD", () => {
    expect(validatePatente("AB-123-CD")).toBe(true);
  });

  it("rejects malformed patente", () => {
    expect(validatePatente("123-ABC")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(validatePatente("abc-123")).toBe(true);
    expect(validatePatente("ab-123-cd")).toBe(true);
  });

  it("rejects empty input", () => {
    expect(validatePatente("")).toBe(false);
  });
});
