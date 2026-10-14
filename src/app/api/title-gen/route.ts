import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// POST /api/title-gen
// Body: { topic: string, count?: number, style?: "viral" | "educational" | "question" | "shocking" | "listicle" }
// Returns: { titles: Array<{ title: string, style: string, hook: string }> }

export async function POST(req: NextRequest) {
  try {
    const { topic, count = 10, style = "viral" } = await req.json();
    if (!topic?.trim()) {
      return NextResponse.json({ error: "Topic required" }, { status: 400 });
    }

    const zai = await ZAI.create();

    const styleInstructions: Record<string, string> = {
      viral: "Clickbait-style titles that make people WANT to click. Use curiosity gaps, surprising facts, and emotional triggers.",
      educational: "Clear, informative titles that tell the viewer exactly what they'll learn.",
      question: "Titles phrased as questions that make the viewer curious about the answer.",
      shocking: "Titles that reveal surprising or shocking information.",
      listicle: "Numbered list titles like '5 amazing facts about...' or '10 things you didn't know about...'",
    };

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a viral title generator for TikTok and YouTube Shorts. Given a topic, generate ${count} catchy titles in different styles.

Style: ${style} — ${styleInstructions[style] || styleInstructions.viral}

Output ONLY valid JSON, no markdown:
{
  "titles": [
    {
      "title": "The actual title text (under 80 chars, no quotes)",
      "style": "viral|educational|question|shocking|listicle",
      "hook": "A 3-second opening hook for this title"
    }
  ]
}

Rules:
- Generate exactly ${count} titles
- Each title must be different
- Titles should be under 80 characters
- Include emoji in some titles
- Make them click-worthy but not misleading
- Topic: ${topic}`,
        },
        { role: "user", content: `Generate ${count} titles about: ${topic}` },
      ],
      thinking: { type: "disabled" },
      temperature: 0.9,
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    if (jsonStart > 0) cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

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
    console.error("Title gen failed:", e);
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}
