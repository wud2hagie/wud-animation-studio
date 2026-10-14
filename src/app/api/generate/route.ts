import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const topic = body?.topic?.trim();
    const contentMode = body?.contentMode ?? "auto";
    const language = body?.language ?? "en";
    const tone = body?.tone ?? "educational";

    if (!topic) {
      return NextResponse.json({ error: "Topic required" }, { status: 400 });
    }

    const zai = await ZAI.create();

    // Mode-specific instructions
    const modeInstructions: Record<string, string> = {
      auto: "AI chooses the best format automatically",
      quiz: "Create a timed trivia quiz with countdown timer and answer reveal",
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
      storytelling: "Narrative-driven story with character arcs — setup, conflict, resolution. 2-3 characters with dialogue.",
      cartoon: "Animated cartoon-style with exaggerated humor. Characters are expressive and comedic.",
      documentary: "Documentary format mixing data-motion (stats), pictorial (archival), character-story (expert quotes). Narrator-driven.",
      news: "Breaking news format. Start with headline, present facts objectively, end with summary.",
      tutorial: "Step-by-step tutorial. Each scene is one step with clear instructions.",
      review: "Product/topic review with pros, cons, and a final rating.",
      mythbusting: "Present a myth, then bust it with real data. Explain why the myth persists.",
      biography: "Biographical timeline — each scene is a life period with key achievements.",
      mystery: "Build suspense throughout. Reveal the answer in the final scene.",
      timelapse: "Show progression over time — each scene is a different time period.",
      comparison: "Compare two things side by side. Use data-motion for comparison stats.",
      top10: "Countdown format — start from #10 and build to #1. Each scene is one item.",
      didyouknow: "Surprising 'did you know' facts that challenge common assumptions.",
      experiment: "Show a science experiment step by step with expected vs actual results.",
    };

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a viral TikTok + YouTube Shorts content strategist. Given a topic and content mode, generate a 25-30 second educational video outline.

Content mode: ${contentMode} — ${modeInstructions[contentMode] || modeInstructions.auto}
Language: ${language}
Tone: ${tone}

Output ONLY valid JSON, no markdown:
{
  "title": "Catchy title under 80 chars",
  "hook": "First 3-second hook that stops scrolling",
  "whyViral": "Why this would go viral (1 sentence)",
  "hashtagSuggestions": ["#fyp", "#learn", "#educational"],
  "scenes": [
    {
      "type": "kinetic-text" | "data-motion" | "character-story" | "abstract-motion" | "pictorial" | "map" | "quiz" | "math",
      "title": "Scene title",
      "durationSec": 4,
      "background": "solid-black" | "neon-gradient" | "starfield" | "aurora" | "grid" | "image",
      "content": {},
      "voiceover": "Spoken narration for this scene (1-2 sentences)",
      "imagePrompt": "Visual description for AI image generation",
      "emoji": "Emoji for this scene"
    }
  ]
}

Rules:
- 5-8 scenes, 25-45 seconds total
- Start with a kinetic-text hook scene
- Include at least 1 data-motion scene with real statistics
- Include at least 1 character-story scene with dialogue
- End with a call-to-action kinetic-text scene
- Every scene must have voiceover text
- Every scene must have an imagePrompt
- Every scene must have an emoji
- Make it educational, surprising, and shareable
- Adapt to the specified content mode: ${contentMode}
- Write in ${language} (${tone} tone)`,
        },
        { role: "user", content: `Topic: ${topic}` },
      ],
      thinking: { type: "disabled" },
      temperature: 0.85,
      max_tokens: 3000,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    // Robust JSON extraction: strip markdown, find the first { and last }, parse
    let cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    // If the response starts with non-JSON text (like # Title or "Here is..."), find the first {
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    if (jsonStart > 0) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to find any JSON object in the text
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
    console.error("Generate failed:", e);
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}
