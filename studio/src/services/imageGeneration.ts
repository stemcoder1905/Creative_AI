// src/services/imageGeneration.ts
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

/**
 * Generate an image using official OpenAI Next-Gen Image Engine
 */
export async function generateImage(
  prompt: string,
  width: number,
  height: number,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY in .env");
  }

  const openai = new OpenAI({ apiKey });

  // Map requested dimensions to supported sizes:
  let size: "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024";
  if (width > height * 1.2) {
    size = "1792x1024";
  } else if (height > width * 1.2) {
    size = "1024x1792";
  }

  const model = process.env.OPENAI_IMAGE_MODEL || "chatgpt-image-latest";

  console.log(`[OpenAI Generation] Invoking official model: ${model} with size: ${size}`);

  const response = await openai.images.generate({
    model: model,
    prompt: prompt,
    size: size,
    n: 1,
    // Latest OpenAI models return base64 by default or URL
  });

  const b64 = response?.data?.[0]?.b64_json;
  const directUrl = response?.data?.[0]?.url;

  if (!b64 && !directUrl) {
    throw new Error("No image data returned from OpenAI");
  }

  if (b64) {
    const imageBuffer = Buffer.from(b64, "base64");

    // Save generated image to Supabase Storage bucket 'designs'
    const fileName = `openai_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.png`;
    const { error: uploadError } = await supabase.storage
      .from("designs")
      .upload(fileName, imageBuffer, { contentType: "image/png", upsert: false });

    if (uploadError) {
      console.warn("Notice: Supabase bucket upload:", uploadError.message);
      return `data:image/png;base64,${b64}`;
    }

    const { data: urlData } = supabase.storage.from("designs").getPublicUrl(fileName);
    return urlData.publicUrl;
  }

  return directUrl!;
}
