import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    if (!topic?.trim()) {
      return NextResponse.json({ error: "Topic required" }, { status: 400 });
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a viral TikTok + YouTube Shorts content strategist. Given a topic, generate a 25-30 second educational video outline.

Output ONLY valid JSON, no markdown, no prose:
{"title":"Catchy title under 80 chars","hook":"First 3-second hook","scenes":[{"type":"kinetic-text","title":"Scene title","durationSec":4,"background":"solid-black","content":{}}]}

Rules:
- 5-6 scenes, total 25-30 seconds
- Start with a kinetic-text hook scene
- Include at least 1 data-motion scene with real stats
- Include at least 1 character-story scene with dialogue
- End with a call-to-action kinetic-text scene
- Make it educational, surprising, and shareable`,
        },
        { role: "user", content: `Topic: ${topic}` },
      ],
      thinking: { type: "disabled" },
      temperature: 0.8,
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
      else throw new Error("AI returned invalid JSON");
    }

    return NextResponse.json(parsed);
  } catch (e: any) {
    console.error("Generate failed:", e);
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}
