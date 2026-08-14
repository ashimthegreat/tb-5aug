import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "content");

export async function readJson<T>(file: string): Promise<T> {
  const raw = await fs.readFile(path.join(CONTENT_DIR, file), "utf-8");
  return JSON.parse(raw) as T;
}

export async function writeJson(file: string, data: unknown): Promise<void> {
  const target = path.join(CONTENT_DIR, file);
  const tmp = `${target}.${process.pid}.${Date.now()}.${Math.random()
    .toString(36)
    .slice(2, 6)}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmp, target);
}
