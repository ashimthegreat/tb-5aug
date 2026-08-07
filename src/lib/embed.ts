import { readFileSync } from "node:fs";
import path from "node:path";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

function publicPath(url: string): string | null {
  const root = path.join(process.cwd(), "public");
  const resolved = path.resolve(root, url);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}

export function publicAsset(
  url: string | undefined
): { filename: string; content: Buffer } | null {
  if (!url) return null;
  try {
    const file = publicPath(url);
    if (!file) return null;
    const filename = path.basename(file);
    return { filename, content: readFileSync(file) };
  } catch {
    return null;
  }
}

export function publicUrlAsDataUri(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const file = publicPath(url);
    if (!file) return undefined;
    const ext = path.extname(url).toLowerCase();
    const mime = MIME[ext] ?? "image/png";
    return `data:${mime};base64,${readFileSync(file).toString("base64")}`;
  } catch {
    return undefined;
  }
}
