// src/services/promptEngine.ts
/**
 * Prompt engineering service – builds a detailed image generation prompt
 * based on user input and the stored profile/brand information.
 *
 * In a production system this would be far more sophisticated (LLM assisted,
 * localization, style weighting, etc.). For the initial vertical slice we
 * create a deterministic template that concatenates the relevant fields.
 */
import { Profile } from '@/types';

export interface DesignBrief {
  profession: string;
  businessName: string;
  topic: string;
  designType: string;
  platform: string;
  style: string;
  language?: string;
  colorPalette?: string;
  logoUrl?: string;
}

/**
 * Build a prompt string for the image‑generation provider.
 */
export function buildPrompt(brief: DesignBrief, profile: Profile): string {
  const lines: string[] = [];
  lines.push(`Create a ${brief.designType} for ${brief.businessName} (${brief.profession}).`);
  if (brief.topic) lines.push(`Topic / message: ${brief.topic}.`);
  lines.push(`Target platform: ${brief.platform} (recommended dimensions).`);
  lines.push(`Visual style: ${brief.style}.`);
  if (brief.language) lines.push(`Language: ${brief.language}.`);
  if (brief.colorPalette) lines.push(`Preferred colors: ${brief.colorPalette}.`);
  if (profile.brandColors) lines.push(`Brand colors: ${profile.brandColors.join(', ')}.`);
  if (brief.logoUrl) lines.push(`Include logo from ${brief.logoUrl}.`);
  lines.push(`Maintain space for headline and call‑to‑action text.`);
  return lines.join(' ');
}
