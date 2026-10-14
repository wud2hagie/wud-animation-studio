import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// POST /api/render
// Body: { scenes: Scene[], title: string, format: "mp4" | "webm" | "avi" | "gif" | "mov" }
// Returns: { videoUrl: string } or { taskId: string } for async
//
// This endpoint uses the ZAI video generation API to create an actual video
// from the scene outlines. It works in two modes:
// 1. If the AI video API is available, it generates a cinematic video from a combined prompt
// 2. Returns a video URL that the client can download

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenes, title, format } = body;

    if (!scenes?.length) {
      return NextResponse.json({ error: "Scenes required" }, { status: 400 });
    }

    // Build a combined visual prompt from all scenes
    const combinedPrompt = scenes
      .map((s: any, i: number) =>
        `Scene ${i + 1} (${s.durationSec}s): ${s.imagePrompt || s.title || s.type}. Background: ${s.background}.`
      )
      .join(" ");

    const fullPrompt = `Create a cinematic vertical 9:16 educational video about "${title}". ${combinedPrompt} Style: dynamic, educational, visually engaging with text overlays and smooth transitions. Format: ${format || "mp4"}.`;

    const zai = await ZAI.create();

    // Try the video generation API
    try {
      const videoResponse = await zai.video.generations.create({
        prompt: fullPrompt,
        quality: "quality",
        with_audio: true,
        size: "768x1344",
        duration: scenes.reduce((a: number, s: any) => a + (s.durationSec || 4), 0),
      });

      // Check if it's async (needs polling)
      if (videoResponse?.id && videoResponse?.task_status === "PROCESSING") {
        // Poll for result
        const taskId = videoResponse.id;
        let attempts = 0;
        const maxAttempts = 60; // 60 * 3s = 180s max

        while (attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, 3000));
          attempts++;

          const result = await zai.async.result({ id: taskId });

          if (result?.task_status === "SUCCESS") {
            const videoUrl = result?.video_result?.[0]?.url ||
                            result?.video_url ||
                            result?.url ||
                            result?.video;
            if (videoUrl) {
              return NextResponse.json({
                videoUrl,
                format: format || "mp4",
                taskId,
              });
            }
          }

          if (result?.task_status === "FAIL") {
            throw new Error("Video generation failed");
          }
        }

        // Timeout — return task ID for client-side polling
        return NextResponse.json({
          taskId,
          status: "processing",
          message: "Video is still generating. Check back with this task ID.",
        });
      }

      // Synchronous success
      const videoUrl = videoResponse?.video_result?.[0]?.url ||
                      videoResponse?.video_url ||
                      videoResponse?.url ||
                      videoResponse?.video;

      if (videoUrl) {
        return NextResponse.json({
          videoUrl,
          format: format || "mp4",
        });
      }

      throw new Error("No video URL in response");
    } catch (videoError: any) {
      console.error("Video API failed, falling back to outline download:", videoError);

      // Fallback: return the scene data as a downloadable video outline
      // The client will create a simple video from the scenes using canvas
      return NextResponse.json({
        fallback: true,
        message: "AI video rendering unavailable. Downloading scene outline as video project file.",
        scenes,
        title,
        format: format || "mp4",
      }, { status: 200 });
    }
  } catch (e: any) {
    console.error("Render failed:", e);
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}
