import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "tb_admin";

export function adminUsername(): string {
  return process.env.ADMIN_USERNAME || "admin";
}

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin";
}

export function adminToken(): string {
  return createHash("sha256")
    .update(`${adminUsername()}:${adminPassword()}`)
    .digest("hex");
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === adminToken();
}

export async function setAuthed(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthed(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}
