import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { readJson } from "./store";

export const ADMIN_COOKIE = "tb_admin";

export type AdminRole = "superadmin" | "sales" | "support" | "content";

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  salt: string;
  role: AdminRole;
  active: boolean;
  createdAt: string;
  email: string;
  smtpHost: string;
  smtpPort: number | null;
  smtpPassEnc: string;
  signatory?: string;
  designation?: string;
  signature?: string;
}

export const ROLES: { value: AdminRole; label: string }[] = [
  { value: "superadmin", label: "Superadmin" },
  { value: "content", label: "Content" },
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
];

function adminSecret(): string {
  const secret = process.env.ADMIN_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_SECRET must be set in production.");
  }
  return "techbucket-local-admin-secret";
}

function mailKey(): Buffer {
  return createHash("sha256").update(`${adminSecret()}:mail`).digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", mailKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecret(blob: string): string {
  const buf = Buffer.from(blob, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", mailKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

export async function getUsers(): Promise<AdminUser[]> {
  try {
    return await readJson<AdminUser[]>("users.json");
  } catch {
    return [];
  }
}

export function hashPassword(
  password: string,
  salt: string = randomBytes(16).toString("hex")
): { hash: string; salt: string } {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string
): boolean {
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function findUser(username: string): Promise<AdminUser | null> {
  const users = await getUsers();
  return (
    users.find((u) => u.username === username.toLowerCase() && u.active) ?? null
  );
}

export async function verifyCredentials(
  username: string,
  password: string
): Promise<AdminUser | null> {
  const user = await findUser(username);
  if (!user) return null;
  if (!verifyPassword(password, user.salt, user.passwordHash)) return null;
  return user;
}

function sessionToken(username: string): string {
  const sig = createHash("sha256")
    .update(`${adminSecret()}:${username}`)
    .digest("hex");
  return `${username}:${sig}`;
}

export async function setAuthed(username: string): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, sessionToken(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthed(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function getCurrentUser(): Promise<AdminUser | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const sep = token.lastIndexOf(":");
  if (sep < 0) return null;
  const username = token.slice(0, sep);
  const sig = token.slice(sep + 1);
  const expected = createHash("sha256")
    .update(`${adminSecret()}:${username}`)
    .digest("hex");
  if (sig !== expected) return null;
  return findUser(username);
}

export async function isAuthed(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}

export async function hasRole(...roles: AdminRole[]): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && roles.includes(user.role);
}
