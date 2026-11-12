import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// POST /api/render
// Body: { scenes: Scene[], title: string, format: string }
// Returns: { videoUrl: string, format: string } — a real video URL from the AI video API
//
// This endpoint calls the ZAI video generation API. If it returns immediately
// (SUCCESS), we return the URL. If it returns PROCESSING, we poll up to 3 minutes.
// The client-side code handles the actual download from the returned URL.

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
        `Scene ${i + 1} (${s.durationSec}s): ${s.imagePrompt || s.title}. Background: ${s.background}.`
      )
      .join(" ");

    const fullPrompt = `Create a cinematic vertical 9:16 educational short video about "${title}". ${combinedPrompt} Style: dynamic, visually engaging, smooth transitions, text overlays, professional quality.`;

    const zai = await ZAI.create();

    // Call the video generation API
    const requestedDuration = scenes.reduce((total: number, scene: any) => total + (scene.durationSec || 4), 0);
    // The provider currently accepts 5- or 10-second jobs only.
    const providerDuration = requestedDuration <= 5 ? 5 : 10;

    const videoResponse = await zai.video.generations.create({
      prompt: fullPrompt,
      quality: "quality",
      with_audio: true,
      size: "768x1344",
      duration: providerDuration,
    });

    // The SDK's create call returns a task (id + task_status), not a
    // completed video result. Fetch results through async.result.query().
    const taskId = videoResponse.id;
    if (!taskId) {
      throw new Error("No task ID returned from video API");
    }

    let attempts = 0;
    const maxAttempts = 60; // 60 * 3s = 180s
    let result = await zai.async.result.query(taskId);

    while (result.task_status === "PROCESSING" && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      attempts += 1;
      result = await zai.async.result.query(taskId);
    }

    if (result.task_status === "SUCCESS") {
      const videoUrl =
        result.video_result?.[0]?.url ||
        result.video_url ||
        result.url ||
        result.video;

      if (videoUrl) {
        return NextResponse.json({
          videoUrl,
          format: format || "mp4",
          status: "success",
        });
      }
      throw new Error("Video task completed without a downloadable URL");
    }

    if (result.task_status === "FAIL") {
      throw new Error("Video generation failed on the provider");
    }

    // Timeout
    return NextResponse.json({
      taskId,
      status: "timeout",
      message: "Video is still generating. Try again in a few minutes.",
    });
  } catch (e: any) {
    console.error("Render failed:", e);
    return NextResponse.json(
      { error: e?.message ?? "Video rendering failed. Use client-side rendering instead." },
      { status: 500 }
    );
  }
}
