import { NextResponse } from "next/server";
import { stampPngBuffer } from "@/lib/stamp";

export async function GET() {
  const buf = await stampPngBuffer();
  if (!buf) {
    return new NextResponse("not found", { status: 404 });
  }
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}