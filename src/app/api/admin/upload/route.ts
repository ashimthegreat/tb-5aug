import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { hasRole } from "@/lib/admin";

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);
const MAX_BYTES = 2 * 1024 * 1024;

function sniffImage(buf: Buffer, ext: string): boolean {
  if (ext === ".png") return buf.length > 8 && buf.readUInt32BE(0) === 0x89504e47;
  if (ext === ".jpg" || ext === ".jpeg")
    return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (ext === ".gif")
    return buf.length > 6 && buf.toString("ascii", 0, 6) === "GIF89a";
  if (ext === ".webp")
    return (
      buf.length > 12 &&
      buf.toString("ascii", 0, 4) === "RIFF" &&
      buf.toString("ascii", 8, 12) === "WEBP"
    );
  return false;
}

export async function POST(req: NextRequest) {
  if (!(await hasRole("superadmin", "content", "saleshead", "sales"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File is too large (max 2 MB)." },
      { status: 400 }
    );
  }
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json(
      { error: "Unsupported file type" },
      { status: 400 }
    );
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (!sniffImage(buf, ext)) {
    return NextResponse.json(
      { error: "File content does not match its type." },
      { status: 400 }
    );
  }
  const meta = await sharp(buf, { failOn: "none" }).metadata();
  let name = `${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}${ext}`;
  let out = buf;
  if (meta.hasAlpha) {
    if ((meta.width ?? 0) < 3 || (meta.height ?? 0) < 3) {
      out = await sharp(buf, { failOn: "none" }).png().toBuffer();
    } else {
      out = await sharp(buf, { failOn: "none" })
        .trim({ threshold: 25 })
        .extend({
          top: 12,
          bottom: 12,
          left: 12,
          right: 12,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
    }
    name = name.replace(/\.[^.]*$/, ".png");
  }
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), out);
  return NextResponse.json({ url: `/uploads/${name}` });
}
