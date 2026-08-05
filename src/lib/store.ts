import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "content");

export async function readJson<T>(file: string): Promise<T> {
  const raw = await fs.readFile(path.join(CONTENT_DIR, file), "utf-8");
  return JSON.parse(raw) as T;
}

export async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.writeFile(
    path.join(CONTENT_DIR, file),
    JSON.stringify(data, null, 2),
    "utf-8"
  );
}
