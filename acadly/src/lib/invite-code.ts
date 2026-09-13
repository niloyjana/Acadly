import { customAlphabet } from "nanoid";
import crypto from "node:crypto";

// Unambiguous alphabet: no 0/O, 1/I/L confusion — codes get typed by hand.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const segment = customAlphabet(ALPHABET, 4);

/** Generates a code like ACD-7FQ9-K2M8. Never predictable, never derived from the space name (PRD §9). */
export function generateInviteCode(): string {
  return `ACD-${segment()}-${segment()}`;
}

/** We store a hash of the code (like a password) so a DB read alone can't leak working invite codes. */
export function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase();
}
