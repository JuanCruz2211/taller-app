/**
 * Normaliza un número de teléfono argentino al formato +549XXXXXXXXX.
 *
 * Acepta:
 * - 10 dígitos: 1144556677 → +5491144556677
 * - 11 dígitos con 9: 91144556677 → +5491144556677
 * - 13 dígitos: 5491144556677 → +5491144556677
 * - 12 dígitos: 541144556677 → +5491144556677
 */
export function normalizePhone(input: string): string {
  const cleaned = input.replace(/\D/g, "");

  if (cleaned.length === 10) return `+549${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith("9"))
    return `+549${cleaned.slice(1)}`;
  if (cleaned.startsWith("549") && cleaned.length === 13) return `+${cleaned}`;
  if (cleaned.startsWith("54") && cleaned.length === 12)
    return `+549${cleaned.slice(2)}`;

  throw new Error("Teléfono inválido");
}

/**
 * Valida una patente argentina en formato viejo (ABC-123) o nuevo (AB-123-CD).
 */
export function validatePatente(input: string): boolean {
  const oldFormat = /^[A-Z]{3}-\d{3}$/;
  const newFormat = /^[A-Z]{2}-\d{3}-[A-Z]{2}$/;
  const upper = input.toUpperCase().trim();

  return oldFormat.test(upper) || newFormat.test(upper);
}
