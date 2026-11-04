// src/services/captionEngine.ts
// Generates contextual, engaging social media captions, titles, and hashtags
// using OpenAI GPT with a resilient rule-based fallback.

import OpenAI from 'openai';
import { DesignBrief, Profile } from '@/types';

export interface SocialCopyInput {
  topic: string;
  designType?: string;
  platform?: string;
  style?: string;
  headline?: string;
  cta?: string;
  businessName?: string;
  profession?: string;
  tone?: string;
}

export interface SocialCopyResult {
  title: string;
  caption: string;
  hashtags: string;
}

const CURRENT_YEAR = new Date().getFullYear(); // e.g. 2026

/**
 * Filter out forbidden placeholder brand names like "My space"
 */
function cleanBrandName(name?: string | null): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (/my\s*space/i.test(trimmed)) {
    return '';
  }
  return trimmed;
}

/**
 * Robust sanitizer that purges forbidden names and updates outdated years
 */
function sanitizeSocialCopy(result: SocialCopyResult, currentYear = CURRENT_YEAR): SocialCopyResult {
  const sanitizeText = (text: string) => {
    if (!text) return '';
    return text
      // Strip any "At My Space, " or "from My Space" or "with My Space"
      .replace(/\b(?:at|from|with|by|in)\s+My\s*Space[,.]?\s*/gi, '')
      .replace(/#?My\s*Space\b/gi, '')
      // Replace outdated years 2020-2025 with the current calendar year (e.g. #Diwali2023 -> #Diwali2026)
      .replace(/202[0-5]/g, String(currentYear))
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/,\s*,/g, ',')
      .trim();
  };

  return {
    title: sanitizeText(result.title),
    caption: sanitizeText(result.caption),
    hashtags: sanitizeText(result.hashtags).replace(/#\s+/g, '#'),
  };
}

/**
 * Fallback generator when OpenAI is unavailable or errors
 */
function generateFallbackCopy(input: SocialCopyInput): SocialCopyResult {
  const topic = input.topic.trim();
  const brand = cleanBrandName(input.businessName) || input.profession || '';
  const cta = input.cta || 'Share your thoughts in the comments below! 👇';

  // Generate catchy clean title
  const words = topic.split(/\s+/).slice(0, 6).join(' ');
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
  const title = capitalized.length > 40 ? `${capitalized.slice(0, 37)}...` : capitalized;

  // Clean hashtags from topic
  const topicTags = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['and', 'for', 'the', 'with', 'this', 'that', 'our'].includes(w))
    .slice(0, 5)
    .map((w) => `#${w}`);

  const brandTag = brand ? `#${brand.replace(/[^a-zA-Z0-9]/g, '')}` : '';
  const yearTag = `#Celebration${CURRENT_YEAR}`;
  const defaultTags = ['#CreativeAI', '#SocialMedia', '#Inspiration', '#Community', yearTag];
  const allHashtags = Array.from(new Set([...topicTags, brandTag, ...defaultTags]))
    .filter(Boolean)
    .join(' ');

  let caption = `✨ ${capitalized} ✨\n\n`;
  caption += `Every moment brings a new story to celebrate. Here's to ${topic}${brand ? ` — with warm wishes from ${brand}` : ''}.\n\n`;
  if (input.headline) {
    caption += `💡 "${input.headline}"\n\n`;
  }
  caption += `${cta}`;

  return sanitizeSocialCopy({
    title: title || 'Creative Highlight',
    caption,
    hashtags: allHashtags,
  }, CURRENT_YEAR);
}

/**
 * Generates an intelligent, high-converting social media copy (title, caption, hashtags)
 */
export async function generateSocialCopy(
  input: SocialCopyInput
): Promise<SocialCopyResult> {
  const brand = cleanBrandName(input.businessName) || input.profession || '';
  const tone = input.tone || 'engaging, authentic, and inspiring';

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return generateFallbackCopy(input);
  }

  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';

  const systemPrompt = `You are an elite social media content creator, copywriter, and brand strategist for platforms like Facebook, Instagram, and LinkedIn.
Your task is to craft rich, human, authentic, and highly engaging social media captions with relevant emojis and hashtags.

CRITICAL TEMPORAL AWARENESS & DATES:
- The current calendar year is strictly ${CURRENT_YEAR}.
- Whenever referencing the current year, any festival or celebration (e.g. Diwali, Holi, New Year, Eid, Christmas), or year-based hashtags (e.g. #Diwali${CURRENT_YEAR}, #NewYear${CURRENT_YEAR}), you MUST ALWAYS use ${CURRENT_YEAR}.
- NEVER use past years such as 2023, 2024, or 2025 under any circumstances!

STRICT BRAND & NAME RESTRICTION:
- NEVER use, invent, or mention the name "My space", "My Space", or "MySpace" anywhere in titles, captions, or hashtags under any circumstances.
- If no brand name is specified, speak warmly from the community/festival perspective (e.g. "Wishing everyone a sparkling festive season...", "May the warmth of family brighten our lives...").

OUTPUT FORMAT:
1. Return strictly valid JSON with keys "title", "caption", and "hashtags".
2. "title": A snappy, relevant 3-6 word title (e.g. "Diwali: Light of Togetherness", "Joyful Festival of Lights"). NEVER include generic placeholder words.
3. "caption": A compelling 2-4 paragraph social media post. Hook the reader with a thoughtful opening line, expand with emotion/value around the topic, include relevant emojis naturally, and end with an interactive question or Call to Action (CTA).
4. "hashtags": 6 to 10 targeted, trending hashtags as a single space-separated string (e.g. "#Diwali${CURRENT_YEAR} #FestivalOfLights #JoyfulCelebration #WomenDuniya").
5. Do NOT include markdown code fences or backticks. Return raw JSON string only.`;

  const userPrompt = `Generate social media copy for:
- Topic / Concept: ${input.topic}
- Design / Post Type: ${input.designType || 'Social Post'}
- Brand / Business Name: ${brand || 'Community'}
- Target Platform: ${input.platform || 'Social Media'}
- Featured Headline: ${input.headline || 'None'}
- Call To Action (CTA): ${input.cta || 'Engage with audience'}
- Tone: ${tone}
- Current Year: ${CURRENT_YEAR}`;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 600,
    });

    const content = response.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return generateFallbackCopy(input);
    }

    const parsed = JSON.parse(content);
    const rawResult: SocialCopyResult = {
      title: parsed.title?.trim() || generateFallbackCopy(input).title,
      caption: parsed.caption?.trim() || generateFallbackCopy(input).caption,
      hashtags: parsed.hashtags?.trim() || generateFallbackCopy(input).hashtags,
    };

    return sanitizeSocialCopy(rawResult, CURRENT_YEAR);
  } catch (err: any) {
    console.error('[CaptionEngine] OpenAI completion failed, using fallback:', err?.message || err);
    return generateFallbackCopy(input);
  }
}

/**
 * Helper to generate social copy from DesignBrief and Profile
 */
export async function generateCopyFromBrief(
  brief: DesignBrief,
  profile: Profile,
  tone?: string
): Promise<SocialCopyResult> {
  return generateSocialCopy({
    topic: brief.topic,
    designType: brief.designType,
    platform: brief.platform,
    style: brief.style,
    headline: brief.headline,
    cta: brief.cta,
    businessName: cleanBrandName(profile.business_name || profile.full_name || ''),
    profession: profile.profession || '',
    tone,
  });
}
