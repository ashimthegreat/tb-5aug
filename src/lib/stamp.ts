import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const LOGO_PATH = "public/images/logo.png";

let cached: Buffer | null = null;

export async function stampPngBuffer(): Promise<Buffer | null> {
  if (cached) return cached;
  try {
    const raw = readFileSync(path.join(process.cwd(), LOGO_PATH));
    const img = sharp(raw, { failOn: "none" }).ensureAlpha();
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    const px = Buffer.from(data);
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] > 8) {
        px[i] = 0;
        px[i + 1] = 0;
        px[i + 2] = 0;
        px[i + 3] = 255;
      } else {
        px[i] = 0;
        px[i + 1] = 0;
        px[i + 2] = 0;
        px[i + 3] = 0;
      }
    }
    const out = await sharp(px, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .png()
      .toBuffer();
    cached = out;
    return out;
  } catch {
    return null;
  }
}

export async function stampDataUrl(): Promise<string | undefined> {
  const buf = await stampPngBuffer();
  return buf ? `data:image/png;base64,${buf.toString("base64")}` : undefined;
}