import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, contentMode, language, tone, storyStyle } = body;
    if (!topic?.trim()) {
      return NextResponse.json({ error: "Topic required" }, { status: 400 });
    }

    const zai = await ZAI.create();

    // Mode-specific scene type instructions
    const modeSceneTypes: Record<string, string> = {
      storytelling: "Use character-story scenes with narrative arcs — setup, conflict, resolution. Include 2-3 characters with dialogue. Use abstract-motion for emotional beats.",
      cartoon: "Use character-story scenes with exaggerated, humorous dialogue. Characters should be cartoonish and expressive. Include kinetic-text for punchlines.",
      documentary: "Mix data-motion (for statistics), pictorial (for archival footage), and character-story (for expert quotes). Narrator-driven.",
      news: "Start with kinetic-text breaking news headline. Use data-motion for statistics. End with kinetic-text summary. Objective, journalistic tone.",
      tutorial: "Step-by-step format. Each scene is one step. Use kinetic-text for step numbers and instructions. Include abstract-motion for process visualization.",
      review: "Present pros/cons as data-motion. Use character-story for personal opinion. End with a rating (kinetic-text with stars/score).",
      mythbusting: "Present a myth (kinetic-text), then bust it with data-motion showing the truth. End with character-story explaining why the myth persists.",
      biography: "Timeline format — each scene is a life period. Use character-story for key moments, data-motion for achievements/stats, pictorial for portraits.",
    };

    const modeInstruction = modeSceneTypes[contentMode] || "Standard educational format";

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a master viral video creator for TikTok and YouTube Shorts. You specialize in ${contentMode || "auto"} content.

Topic: ${topic}
Mode: ${contentMode}
Tone: ${tone}
Language: ${language}
${storyStyle ? `Story style: ${storyStyle}` : ""}

Special instructions for this mode: ${modeInstruction}

Output ONLY valid JSON, no markdown:
{
  "title": "Catchy title under 80 chars",
  "hook": "First 3-second hook that stops scrolling",
  "whyViral": "Why this would go viral (1 sentence)",
  "hashtagSuggestions": ["#fyp", "#learn", "#viral", ...],
  "scenes": [
    {
      "type": "kinetic-text" | "data-motion" | "character-story" | "abstract-motion" | "pictorial" | "map" | "quiz" | "math",
      "title": "Scene title",
      "durationSec": 4,
      "background": "solid-black" | "neon-gradient" | "starfield" | "aurora" | "grid" | "image",
      "content": {},
      "voiceover": "Spoken narration (1-2 sentences, conversational)",
      "imagePrompt": "Visual description for AI image generation (cinematic, vertical 9:16)",
      "character": "Character name (if character-story)",
      "emoji": "Emoji for this scene",
      "transition": "fade" | "slide-left" | "pop" | "zoom-in"
    }
  ]
}

Rules:
- 5-8 scenes, 25-45 seconds total
- Start with kinetic-text hook
- Include at least 1 data-motion scene with real statistics
- Include at least 1 character-story scene with dialogue (especially for storytelling/cartoon)
- End with call-to-action kinetic-text
- Every scene must have voiceover text
- Every scene must have an imagePrompt for AI image generation
- Every scene must have an emoji
- Use ${tone} tone throughout
- Write voiceover in ${language}
- Make it surprising, educational, and shareable`,
        },
        { role: "user", content: `Topic: ${topic}` },
      ],
      thinking: { type: "disabled" },
      temperature: 0.85,
      max_tokens: 3000,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    if (jsonStart > 0) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch {
          throw new Error("AI returned invalid JSON: " + cleaned.substring(0, 100));
        }
      } else {
        throw new Error("AI returned no JSON: " + cleaned.substring(0, 100));
      }
    }

    return NextResponse.json(parsed);
  } catch (e: any) {
    console.error("Story generate failed:", e);
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}
