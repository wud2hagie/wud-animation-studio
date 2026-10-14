import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const topic = body?.topic?.trim();
    const contentMode = body?.contentMode ?? "auto";
    const language = body?.language ?? "en";
    const tone = body?.tone ?? "educational";
    const resolution = body?.resolution ?? "720p";

    if (!topic) {
      return NextResponse.json({ error: "Topic required" }, { status: 400 });
    }

    const zai = await ZAI.create();

    // Build mode-specific instructions
    const modeInstructions: Record<string, string> = {
      auto: "AI chooses the best format automatically",
      quiz: "Create a timed trivia quiz with countdown timer and answer reveal at the end",
      facts: "Create 5-6 amazing facts, each with its own dedicated scene",
      guinness: "Focus on Guinness World Records with record-breaking statistics",
      travel: "Include a map scene with real lat/lng coordinates for travel destinations",
      natgeo: "National Geographic-style nature documentary with cinematic visuals",
      science: "Scientific explanations with data visualizations and experiments",
      history: "Historical events with a timeline and key figures as characters",
      health: "Health tips, nutrition facts, and fitness science",
      tech: "Technology explainers, gadgets, and coding concepts",
      sports: "Sports records, athlete facts, and game strategies",
      food: "Food science, recipes, and cultural cuisine highlights",
      art: "Art history, techniques, and famous artworks",
      space: "Space exploration, astronomy, and universe facts",
      math: "Math problems solved step-by-step with clear explanations",
      music: "Music theory, instruments, and famous composers",
    };

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a viral TikTok + YouTube Shorts content strategist. Given a topic and content mode, generate a 25-30 second educational video outline.

Content mode: ${contentMode} — ${modeInstructions[contentMode] || modeInstructions.auto}
Language: ${language}
Tone: ${tone}
Resolution: ${resolution}

Output ONLY valid JSON, no markdown, no prose:
{
  "title": "Catchy title under 80 chars",
  "hook": "First 3-second hook that stops scrolling",
  "whyViral": "Why this would go viral (1 sentence)",
  "hashtagSuggestions": ["#fyp", "#learn", "#educational"],
  "scenes": [
    {
      "type": "kinetic-text" | "data-motion" | "character-story" | "abstract-motion",
      "title": "Scene title",
      "durationSec": 4,
      "background": "solid-black" | "neon-gradient" | "starfield" | "aurora",
      "content": {},
      "voiceover": "Spoken narration for this scene (1-2 sentences)",
      "imagePrompt": "Visual description for AI image generation"
    }
  ]
}

Rules:
- 5-6 scenes, total 25-30 seconds
- Start with a kinetic-text hook scene
- Include at least 1 data-motion scene with real statistics
- Include at least 1 character-story scene with dialogue
- End with a call-to-action kinetic-text scene
- Every scene must have a voiceover line
- Every scene must have an imagePrompt for AI image generation
- Make it educational, surprising, and shareable
- Adapt to the specified content mode: ${contentMode}
- Write in ${language} (${tone} tone)`,
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
