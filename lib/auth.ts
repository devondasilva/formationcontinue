import { cookies } from "next/headers";
import { SessionPayload, UserRole } from "./types";

export const SESSION_COOKIE = "mfc_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 jours

const AUTH_SECRET = process.env.AUTH_SECRET || "mades-formation-dev-secret-change-me";

// Ce module est importé par le middleware (runtime Edge) : il n'utilise que
// l'API Web Crypto globale (crypto.subtle), jamais le module Node `crypto`
// (voir lib/password.ts pour le hachage des mots de passe, Node uniquement).

function base64urlFromBytes(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function bytesFromBase64url(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    input.length + ((4 - (input.length % 4)) % 4),
    "="
  );
  const str = atob(padded);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder().encode(AUTH_SECRET);
  return crypto.subtle.importKey("raw", enc, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function sign(data: string): Promise<string> {
  const key = await getHmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return base64urlFromBytes(new Uint8Array(sig));
}

export async function createSessionToken(role: UserRole, id: string, name: string): Promise<string> {
  const payload: SessionPayload = { role, id, name, exp: Date.now() + SESSION_DURATION_MS };
  const encoded = base64urlFromBytes(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await sign(encoded);
  return `${encoded}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = await sign(encoded);
  if (expected !== signature) return null;
  try {
    const json = new TextDecoder().decode(bytesFromBase64url(encoded));
    const payload = JSON.parse(json) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getServerSession(): SessionPayload | null | Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export async function requireAdmin(): Promise<SessionPayload | null> {
  const session = await getServerSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function requireLearner(): Promise<SessionPayload | null> {
  const session = await getServerSession();
  if (!session || session.role !== "learner") return null;
  return session;
}
