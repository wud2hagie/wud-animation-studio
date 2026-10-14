import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(req: NextRequest) {
  try {
    const { text, language } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: "Text required" }, { status: 400 });
    }

    const zai = await ZAI.create();
    const response = await zai.audio.tts.create({
      input: text,
      voice: "tongtong",
      response_format: "wav",
    });

    // response might be a blob, buffer, or base64 depending on SDK version
    let audioUrl: string;

    if (response instanceof ArrayBuffer || response instanceof Uint8Array) {
      const base64 = Buffer.from(response).toString("base64");
      audioUrl = `data:audio/wav;base64,${base64}`;
    } else if (typeof response === "string" && response.startsWith("data:")) {
      audioUrl = response;
    } else if (response?.data) {
      // If it returns base64 directly
      audioUrl = `data:audio/wav;base64,${response.data}`;
    } else if (response?.url) {
      audioUrl = response.url;
    } else {
      // Try blob
      const blob = await (response as any).blob?.();
      if (blob) {
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        audioUrl = `data:audio/wav;base64,${base64}`;
      } else {
        throw new Error("Unexpected TTS response format");
      }
    }

    return NextResponse.json({
      audio: audioUrl,
      language: language || "en",
    });
  } catch (e: any) {
    console.error("TTS failed:", e);
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}
