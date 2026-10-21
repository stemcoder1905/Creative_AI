// src/services/imageGeneration.ts
/**
 * Wrapper around the OpenAI Image Generation API.
 * This service receives a prompt (created by the promptEngine) and returns a publicly
 * accessible URL to the generated image stored in Supabase Storage.
 */
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY || "dummy-key-for-build";
  return new OpenAI({ apiKey });
}

/**
 * Generate an image via OpenAI.
 * @param prompt Full textual prompt describing the desired image.
 * @param width Desired width in pixels (e.g., 1080).
 * @param height Desired height in pixels (e.g., 1080).
 * @returns Public URL to the uploaded image.
 */
export async function generateImage(
  prompt: string,
  width: number,
  height: number,
): Promise<string> {
  const openai = getOpenAIClient();

  // Map requested aspect ratio / dimensions to OpenAI DALL-E 3 supported sizes:
  // "1024x1024" (square), "1792x1024" (landscape), "1024x1792" (portrait)
  let size: "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024";
  if (width > height * 1.2) {
    size = "1792x1024";
  } else if (height > width * 1.2) {
    size = "1024x1792";
  }

  // Call OpenAI API
  const response = await openai.images.generate({
    model: process.env.OPENAI_IMAGE_MODEL ?? "dall-e-3",
    prompt,
    size,
    n: 1,
    response_format: "b64_json", // get base64-encoded image data
  });

  const b64 = response?.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image returned from OpenAI");

  // Convert base64 to Buffer
  const buffer = Buffer.from(b64, "base64");

  // Upload to Supabase Storage (bucket "designs")
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.png`;
  const { data, error } = await supabase.storage
    .from("designs")
    .upload(fileName, buffer, { contentType: "image/png", upsert: false });

  if (error) throw error;

  // Generate a public URL
  const { data: urlData } = supabase.storage.from("designs").getPublicUrl(fileName);
  return urlData.publicUrl;
}
