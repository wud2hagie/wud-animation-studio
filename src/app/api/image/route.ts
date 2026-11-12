import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { requirePermission } from "@/lib/auth/require-admin";

export async function POST(req: NextRequest) {
  const auth = await requirePermission("image_gen");
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  try {
    const { prompt } = await req.json();
    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Image prompt required" }, { status: 400 });
    }

    const zai = await ZAI.create();
    const response = await zai.images.generations.create({
      prompt: `${prompt}, vertical 9:16, cinematic, high quality`,
      size: "768x1344" as any,
    });

    const base64 = response.data?.[0]?.base64;
    if (!base64) throw new Error("Image generation returned no data");

    return NextResponse.json({ base64 });
  } catch (e: any) {
    console.error("Image gen failed:", e);
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}
